const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Cross-Chain Functionality...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const contracts = {
    arbitrumSepolia: {
      chainId: 421614,
      nameService: "0xAaFE053F1D8402282c839aeb595218F30aa7DCC6",
      marketplace: "0x897FBB05A18ceE2d9451a9F644B9831DDf4Dd481"
    },
    zetaChain: {
      chainId: 7001,
      nameService: "0x6F40A56250fbB57F5a17C815BE66A36804590669",
      marketplace: "0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6"
    },
    ethereumSepolia: {
      chainId: 11155111,
      nameService: "0x19E88E3790A43721faD03CD5A68A100E18F40c4E",
      marketplace: "0x7a9D78D1E5fe688F80D4C2c06Ca4C0407A967644"
    }
  };

  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Get current network contracts
  let currentContracts;
  if (currentChainId === 421614) {
    currentContracts = contracts.arbitrumSepolia;
    console.log("🔗 Testing on Arbitrum Sepolia");
  } else if (currentChainId === 7001) {
    currentContracts = contracts.zetaChain;
    console.log("🔗 Testing on ZetaChain Testnet");
  } else if (currentChainId === 11155111) {
    currentContracts = contracts.ethereumSepolia;
    console.log("🔗 Testing on Ethereum Sepolia");
  } else {
    console.log("❌ Unsupported network for testing");
    return;
  }

  // Connect to contracts
  const nameServiceABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function getSupportedChains() external view returns (uint256[] memory)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable"
  ];

  const nameService = new ethers.Contract(currentContracts.nameService, nameServiceABI, deployer);

  try {
    // Test 1: Check supported chains
    console.log("📋 Test 1: Checking supported chains...");
    const supportedChains = await nameService.getSupportedChains();
    console.log("Supported chains:", supportedChains.map(id => id.toString()));
    
    // Test 2: Check domain availability
    console.log("\n📋 Test 2: Checking domain availability...");
    const testDomain = "crosschaintest";
    const isAvailable = await nameService.isAvailable(testDomain);
    console.log(`Domain "${testDomain}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      // Test 3: Register omnichain domain
      console.log("\n📋 Test 3: Registering omnichain domain...");
      
      // Use chain-specific pricing
      let registrationPrice;
      if (currentChainId === 11155111) {
        registrationPrice = ethers.parseEther("0.002"); // Ethereum Sepolia
      } else {
        registrationPrice = ethers.parseEther("0.001"); // Other chains
      }
      
      console.log(`Registering "${testDomain}.zeta" as omnichain domain...`);
      console.log(`Registration price: ${ethers.formatEther(registrationPrice)} ETH`);
      const registerTx = await nameService.register(testDomain, true, {
        value: registrationPrice
      });
      
      console.log("Transaction hash:", registerTx.hash);
      console.log("Waiting for confirmation...");
      await registerTx.wait();
      console.log("✅ Domain registered successfully!");

      // Test 4: Check domain info
      console.log("\n📋 Test 4: Checking domain info...");
      const domainInfo = await nameService.getDomainInfo(testDomain);
      console.log("Domain info:", {
        owner: domainInfo[0],
        expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
        sourceChainId: domainInfo[2].toString(),
        isOmnichain: domainInfo[3],
        isExpired: domainInfo[4]
      });

      // Test 5: Cross-chain transfer simulation
      console.log("\n📋 Test 5: Cross-chain transfer simulation...");
      let targetChainId, targetChainName;
      if (currentChainId === 421614) {
        targetChainId = 7001;
        targetChainName = "ZetaChain Testnet";
      } else if (currentChainId === 7001) {
        targetChainId = 421614;
        targetChainName = "Arbitrum Sepolia";
      } else if (currentChainId === 11155111) {
        targetChainId = 7001;
        targetChainName = "ZetaChain Testnet";
      }
      
      console.log(`Simulating cross-chain transfer to ${targetChainName} (${targetChainId})`);
      
      try {
        const transferFee = ethers.parseEther("0.0001");
        const transferTx = await nameService.crossChainTransfer(
          testDomain,
          deployer.address, // Transfer to self for testing
          targetChainId,
          { value: transferFee }
        );
        
        console.log("Cross-chain transfer transaction:", transferTx.hash);
        console.log("Waiting for confirmation...");
        await transferTx.wait();
        console.log("✅ Cross-chain transfer initiated!");
        
        console.log("\n🔄 Cross-chain transfer process:");
        console.log("1. Domain locked on source chain");
        console.log("2. Cross-chain message sent via ZetaChain");
        console.log("3. Domain will be unlocked on target chain");
        console.log("4. Check target chain after 2-5 minutes");
        
      } catch (error) {
        console.log("⚠️ Cross-chain transfer failed:", error.message);
        console.log("This might be expected if cross-chain infrastructure is not fully configured");
      }

    } else {
      // Domain already exists, check its info
      console.log("\n📋 Domain already exists, checking info...");
      const owner = await nameService.ownerOf(testDomain);
      const domainInfo = await nameService.getDomainInfo(testDomain);
      
      console.log("Current owner:", owner);
      console.log("Domain info:", {
        owner: domainInfo[0],
        expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
        sourceChainId: domainInfo[2].toString(),
        isOmnichain: domainInfo[3],
        isExpired: domainInfo[4]
      });
    }

    // Test 6: Marketplace functionality
    console.log("\n📋 Test 6: Testing marketplace...");
    const marketplaceABI = [
      "function getSupportedChains() external view returns (uint256[] memory)",
      "function getListingFee(uint256 chainId) external view returns (uint256)",
      "function isListingActive(string calldata name) external view returns (bool)"
    ];

    const marketplace = new ethers.Contract(currentContracts.marketplace, marketplaceABI, deployer);
    
    const marketplaceSupportedChains = await marketplace.getSupportedChains();
    console.log("Marketplace supported chains:", marketplaceSupportedChains.map(id => id.toString()));
    
    const listingFee = await marketplace.getListingFee(currentChainId);
    console.log(`Listing fee on chain ${currentChainId}:`, ethers.formatEther(listingFee), "ETH");

    console.log("\n✨ Cross-chain functionality test completed!");
    console.log("\n🎯 Next steps to test full cross-chain:");
    console.log("1. Switch to the other network (Arbitrum Sepolia ↔ ZetaChain)");
    console.log("2. Run this script again to test from the other side");
    console.log("3. Check if domains appear on both networks");
    console.log("4. Test cross-chain marketplace offers");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });