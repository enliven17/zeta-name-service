const { ethers } = require('hardhat');

async function debugDomainLoading() {
  console.log('🔍 Debugging Domain Loading Issue...\n');

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
    
    // Test domain name - use a fresh one
    const domainName = "testdomain" + Date.now();
    
    console.log('📝 Step 1: Registering fresh domain with omnichain enabled...');
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

    console.log('\n📊 Step 2: Checking domain info immediately after registration...');
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

    // Check cross-chain transfer eligibility
    console.log('\n🌉 Step 3: Checking cross-chain transfer eligibility...');
    const canTransferCrossChain = processedDomainInfo.isOmnichain && 
                                 processedDomainInfo.owner !== "0x0000000000000000000000000000000000000000" &&
                                 !processedDomainInfo.isExpired;

    console.log('Can transfer cross-chain:', canTransferCrossChain);
    console.log('Is omnichain:', processedDomainInfo.isOmnichain);
    console.log('Has owner:', processedDomainInfo.owner !== "0x0000000000000000000000000000000000000000");
    console.log('Not expired:', !processedDomainInfo.isExpired);

    if (canTransferCrossChain) {
      console.log('✅ Domain is eligible for cross-chain transfer');
      console.log('✅ Frontend should show cross-chain transfer button');
      
      // Test actual cross-chain transfer
      console.log('\n🌉 Step 4: Testing actual cross-chain transfer...');
      const targetChainId = 11155111; // Ethereum Sepolia
      
      try {
        const crossChainTx = await contract.crossChainTransfer(
          domainName,
          deployer.address,
          targetChainId,
          {
            gasLimit: 1000000
          }
        );
        
        console.log('Cross-chain transfer transaction:', crossChainTx.hash);
        console.log('⏳ Waiting for transaction confirmation...');
        await crossChainTx.wait();
        console.log('✅ Cross-chain transfer initiated successfully!');
        
        // Check if domain was burned
        const domainInfoAfter = await contract.getDomainInfo(domainName);
        console.log('\nDomain info after transfer:', {
          owner: domainInfoAfter[0],
          isOmnichain: domainInfoAfter[3],
          isExpired: domainInfoAfter[4]
        });
        
        if (domainInfoAfter[0] === "0x0000000000000000000000000000000000000000") {
          console.log('✅ Domain was burned on source chain (transfer successful)');
        } else {
          console.log('❌ Domain still exists on source chain (transfer failed)');
        }
        
      } catch (error) {
        console.log('❌ Cross-chain transfer failed:', error.message);
      }
      
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

    console.log('\n📋 Domain Loading Debug Summary:');
    console.log('=================================');
    console.log('Domain Name:', domainName);
    console.log('Owner:', processedDomainInfo.owner);
    console.log('Is Omnichain:', processedDomainInfo.isOmnichain);
    console.log('Source Chain ID:', processedDomainInfo.sourceChainId);
    console.log('Current Chain ID:', currentChainId);
    console.log('Is Expired:', processedDomainInfo.isExpired);
    console.log('Can Transfer Cross-Chain:', canTransferCrossChain);
    
    if (processedDomainInfo.isOmnichain && canTransferCrossChain) {
      console.log('✅ Everything should work in frontend');
      console.log('✅ Cross-chain transfer should be enabled');
    } else {
      console.log('❌ Something is wrong with the configuration');
      console.log('💡 Check the issues above');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugDomainLoading()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
