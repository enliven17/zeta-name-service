const { ethers } = require('hardhat');

async function testFrontendDomainLoading() {
  console.log('🔍 Testing Frontend Domain Loading...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // FIXED Universal App contract addresses
  const arbFixedAddress = "0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd";

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
    
    console.log('📝 Step 1: Checking domain info...');
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
      console.log('✅ Frontend should show cross-chain transfer button');
      console.log('✅ Frontend should show "Omnichain" badge');
    } else {
      console.log('❌ Domain is NOT configured for omnichain (cross-chain disabled)');
      console.log('❌ Frontend should NOT show cross-chain transfer button');
      console.log('❌ Frontend should NOT show "Omnichain" badge');
    }

    // Test cross-chain transfer eligibility
    console.log('\n🌉 Step 2: Testing cross-chain transfer eligibility...');
    const canTransferCrossChain = processedDomainInfo.isOmnichain && 
                                 processedDomainInfo.owner !== "0x0000000000000000000000000000000000000000" &&
                                 !processedDomainInfo.isExpired;

    if (canTransferCrossChain) {
      console.log('✅ Domain is eligible for cross-chain transfer');
      console.log('✅ Frontend should enable cross-chain transfer button');
    } else {
      console.log('❌ Domain is NOT eligible for cross-chain transfer');
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

    console.log('\n📋 Frontend Domain Loading Test Summary:');
    console.log('========================================');
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
      console.log('✅ Cross-chain transfer button should be visible');
      console.log('✅ Omnichain badge should be visible');
    } else {
      console.log('❌ Domain is NOT configured for cross-chain transfers');
      console.log('💡 Fix: Re-register domain with omnichain=true');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendDomainLoading()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
