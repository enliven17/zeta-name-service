const { ethers } = require('hardhat');

async function testFrontendDomainInfo() {
  console.log('🔍 Testing Frontend Domain Info Loading...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // FIXED Universal App contract addresses
  const arbFixedAddress = "0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd";
  const ethFixedAddress = "0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  try {
    const contract = new ethers.Contract(arbFixedAddress, ABI, deployer);
    
    // Test domain name
    const domainName = "frontendtest";
    
    console.log('📝 Step 1: Checking if domain exists...');
    const isAvailable = await contract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      console.log('\n📝 Step 2: Registering domain with omnichain enabled...');
      const registrationPrice = ethers.parseEther("0.001");
      
      try {
        const registerTx = await contract.register(domainName, true, { // true = omnichain
          value: registrationPrice,
          gasLimit: 200000
        });
        
        console.log('Registration transaction:', registerTx.hash);
        console.log('⏳ Waiting for transaction confirmation...');
        await registerTx.wait();
        console.log('✅ Domain registered successfully!');
      } catch (error) {
        console.log('❌ Registration failed:', error.message);
        return;
      }
    } else {
      console.log('Domain already exists, checking current status...');
    }

    console.log('\n📊 Step 3: Checking domain info (as frontend would)...');
    const domainInfo = await contract.getDomainInfo(domainName);
    console.log('Raw domain info from contract:', {
      owner: domainInfo[0],
      expiresAt: domainInfo[1].toString(),
      sourceChainId: domainInfo[2].toString(),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    });

    // Simulate frontend processing
    const processedDomainInfo = {
      owner: domainInfo[0],
      expiresAt: Number(domainInfo[1]),
      sourceChainId: Number(domainInfo[2]),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    };

    console.log('\n📊 Processed domain info (as frontend would see):', {
      owner: processedDomainInfo.owner,
      expiresAt: new Date(processedDomainInfo.expiresAt * 1000).toISOString(),
      sourceChainId: processedDomainInfo.sourceChainId,
      isOmnichain: processedDomainInfo.isOmnichain,
      isExpired: processedDomainInfo.isExpired
    });

    // Check if domain is omnichain
    if (processedDomainInfo.isOmnichain) {
      console.log('✅ Domain is configured for omnichain (cross-chain enabled)');
      console.log('✅ Frontend should show cross-chain transfer option');
    } else {
      console.log('❌ Domain is NOT configured for omnichain (cross-chain disabled)');
      console.log('❌ Frontend should NOT show cross-chain transfer option');
      console.log('💡 This is why cross-chain transfer is not working!');
    }

    // Test cross-chain transfer eligibility
    console.log('\n🌉 Step 4: Testing cross-chain transfer eligibility...');
    const canTransferCrossChain = processedDomainInfo.isOmnichain && 
                                 processedDomainInfo.owner !== "0x0000000000000000000000000000000000000000" &&
                                 !processedDomainInfo.isExpired;

    if (canTransferCrossChain) {
      console.log('✅ Domain is eligible for cross-chain transfer');
      console.log('✅ Frontend should enable cross-chain transfer button');
    } else {
      console.log('❌ Domain is NOT eligible for cross-chain transfer');
      console.log('❌ Frontend should disable cross-chain transfer button');
      
      if (!processedDomainInfo.isOmnichain) {
        console.log('   - Reason: Domain is not omnichain enabled');
      }
      if (processedDomainInfo.owner === "0x0000000000000000000000000000000000000000") {
        console.log('   - Reason: Domain has no owner');
      }
      if (processedDomainInfo.isExpired) {
        console.log('   - Reason: Domain has expired');
      }
    }

    console.log('\n📋 Frontend Domain Info Test Summary:');
    console.log('=====================================');
    console.log('Domain Name:', domainName);
    console.log('Owner:', processedDomainInfo.owner);
    console.log('Is Omnichain:', processedDomainInfo.isOmnichain);
    console.log('Source Chain ID:', processedDomainInfo.sourceChainId);
    console.log('Current Chain ID:', currentChainId);
    console.log('Is Expired:', processedDomainInfo.isExpired);
    console.log('Can Transfer Cross-Chain:', canTransferCrossChain);
    
    if (processedDomainInfo.isOmnichain) {
      console.log('✅ Domain is properly configured for cross-chain transfers');
      console.log('✅ Frontend should work correctly');
    } else {
      console.log('❌ Domain is NOT configured for cross-chain transfers');
      console.log('💡 Fix: Re-register domain with omnichain=true');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendDomainInfo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
