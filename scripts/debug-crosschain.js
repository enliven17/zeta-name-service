const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Cross-Chain Issues...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Contract addresses
  const contractAddress = currentChainId === 421614 
    ? "0xAaFE053F1D8402282c839aeb595218F30aa7DCC6" 
    : currentChainId === 11155111
    ? "0x6783fB75e995Af777026141C68baee68a8C68c70"
    : "0x6F40A56250fbB57F5a17C815BE66A36804590669";

  console.log("Contract address:", contractAddress);

  // Extended ABI with error handling
  const nameServiceABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function getSupportedChains() external view returns (uint256[] memory)",
    "function getChainConfig(uint256 chainId) external view returns (tuple(bool isSupported, uint256 registrationPrice, uint256 transferFee, string rpcUrl, string explorerUrl))",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function transfer(string calldata name, address to) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable",
    "function zetaConnector() external view returns (address)",
    "function zetaToken() external view returns (address)",
    "function tssAddress() external view returns (address)"
  ];

  const nameService = new ethers.Contract(contractAddress, nameServiceABI, deployer);

  try {
    // Test 1: Check contract state
    console.log("📋 Test 1: Checking contract configuration...");
    
    const supportedChains = await nameService.getSupportedChains();
    console.log("Supported chains:", supportedChains.map(id => id.toString()));

    // Check ZetaChain configuration
    try {
      const zetaConnector = await nameService.zetaConnector();
      const zetaToken = await nameService.zetaToken();
      const tssAddress = await nameService.tssAddress();
      
      console.log("ZetaChain configuration:");
      console.log("- Connector:", zetaConnector);
      console.log("- Token:", zetaToken);
      console.log("- TSS:", tssAddress);
    } catch (error) {
      console.log("⚠️ ZetaChain configuration not accessible:", error.message);
    }

    // Test 2: Check chain configurations
    console.log("\n📋 Test 2: Checking chain configurations...");
    const testChains = [421614, 7001];
    
    for (const chainId of testChains) {
      try {
        const config = await nameService.getChainConfig(chainId);
        console.log(`Chain ${chainId} config:`, {
          isSupported: config[0],
          registrationPrice: ethers.formatEther(config[1]),
          transferFee: ethers.formatEther(config[2]),
          rpcUrl: config[3],
          explorerUrl: config[4]
        });
      } catch (error) {
        console.log(`❌ Failed to get config for chain ${chainId}:`, error.message);
      }
    }

    // Test 3: Check existing domain
    console.log("\n📋 Test 3: Checking existing domain...");
    const testDomain = "crosschaintest";
    
    try {
      const isAvailable = await nameService.isAvailable(testDomain);
      console.log(`Domain "${testDomain}.zeta" is available:`, isAvailable);

      if (!isAvailable) {
        const owner = await nameService.ownerOf(testDomain);
        const domainInfo = await nameService.getDomainInfo(testDomain);
        
        console.log("Domain owner:", owner);
        console.log("Domain info:", {
          owner: domainInfo[0],
          expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
          sourceChainId: domainInfo[2].toString(),
          isOmnichain: domainInfo[3],
          isExpired: domainInfo[4]
        });

        // Test 4: Try simple transfer first
        console.log("\n📋 Test 4: Testing simple transfer...");
        if (domainInfo[0].toLowerCase() === deployer.address.toLowerCase()) {
          try {
            const transferFee = ethers.parseEther("0.0001");
            console.log("Attempting simple transfer to self...");
            
            // Estimate gas first
            const gasEstimate = await nameService.transfer.estimateGas(
              testDomain,
              deployer.address,
              { value: transferFee }
            );
            console.log("Gas estimate for simple transfer:", gasEstimate.toString());

            const transferTx = await nameService.transfer(
              testDomain,
              deployer.address,
              { 
                value: transferFee,
                gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
              }
            );
            
            console.log("Simple transfer transaction:", transferTx.hash);
            await transferTx.wait();
            console.log("✅ Simple transfer successful!");

          } catch (error) {
            console.log("❌ Simple transfer failed:", error.message);
            
            // Try to decode the error
            if (error.data) {
              console.log("Error data:", error.data);
            }
          }
        }

        // Test 5: Try cross-chain transfer with detailed error handling
        console.log("\n📋 Test 5: Testing cross-chain transfer with error handling...");
        if (domainInfo[0].toLowerCase() === deployer.address.toLowerCase() && domainInfo[3]) {
          const targetChainId = currentChainId === 421614 ? 7001 : 421614;
          
          try {
            console.log(`Attempting cross-chain transfer to chain ${targetChainId}...`);
            
            // Check if target chain is supported
            const targetConfig = await nameService.getChainConfig(targetChainId);
            console.log("Target chain supported:", targetConfig[0]);
            
            if (!targetConfig[0]) {
              console.log("❌ Target chain not supported");
              return;
            }

            const transferFee = ethers.parseEther("0.0001");
            
            // Estimate gas for cross-chain transfer
            try {
              const gasEstimate = await nameService.crossChainTransfer.estimateGas(
                testDomain,
                deployer.address,
                targetChainId,
                { value: transferFee }
              );
              console.log("Gas estimate for cross-chain transfer:", gasEstimate.toString());

              const crossChainTx = await nameService.crossChainTransfer(
                testDomain,
                deployer.address,
                targetChainId,
                { 
                  value: transferFee,
                  gasLimit: gasEstimate * 150n / 100n // Add 50% buffer for cross-chain
                }
              );
              
              console.log("Cross-chain transfer transaction:", crossChainTx.hash);
              await crossChainTx.wait();
              console.log("✅ Cross-chain transfer successful!");

            } catch (gasError) {
              console.log("❌ Gas estimation failed:", gasError.message);
              
              // Try with manual gas limit
              console.log("Trying with manual gas limit...");
              try {
                const crossChainTx = await nameService.crossChainTransfer(
                  testDomain,
                  deployer.address,
                  targetChainId,
                  { 
                    value: transferFee,
                    gasLimit: 500000 // Manual gas limit
                  }
                );
                
                console.log("Cross-chain transfer transaction:", crossChainTx.hash);
                await crossChainTx.wait();
                console.log("✅ Cross-chain transfer successful with manual gas!");

              } catch (manualError) {
                console.log("❌ Manual gas also failed:", manualError.message);
                
                // Decode revert reason if available
                if (manualError.data) {
                  console.log("Revert data:", manualError.data);
                }
                if (manualError.reason) {
                  console.log("Revert reason:", manualError.reason);
                }
              }
            }

          } catch (error) {
            console.log("❌ Cross-chain transfer setup failed:", error.message);
          }
        } else {
          console.log("⚠️ Cannot test cross-chain transfer:");
          console.log("- Not owner:", domainInfo[0].toLowerCase() !== deployer.address.toLowerCase());
          console.log("- Not omnichain:", !domainInfo[3]);
        }
      }

    } catch (error) {
      console.log("❌ Domain check failed:", error.message);
    }

    console.log("\n🔍 Debug analysis complete!");
    console.log("\n💡 Possible issues:");
    console.log("1. ZetaChain connector not properly configured");
    console.log("2. Cross-chain infrastructure not fully set up");
    console.log("3. Insufficient gas for cross-chain operations");
    console.log("4. Domain not properly configured for omnichain");

  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug script failed:", error);
    process.exit(1);
  });