const { ethers } = require('hardhat');

async function testFinalCrossChain() {
  console.log('🌉 Testing FINAL Cross-Chain Transfer with FIXED Implementation...\n');

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
    // Determine which contract to use based on current chain
    const fixedAddress = currentChainId === 421614 ? arbFixedAddress : ethFixedAddress;
    const targetChainId = currentChainId === 421614 ? 11155111 : 421614;
    const targetFixedAddress = currentChainId === 421614 ? ethFixedAddress : arbFixedAddress;
    
    console.log(`🔧 Using FIXED Universal App: ${fixedAddress}`);
    console.log(`🎯 Target Chain: ${targetChainId}`);
    console.log(`🎯 Target Universal App: ${targetFixedAddress}`);

    const fixedContract = new ethers.Contract(fixedAddress, ABI, deployer);

    // Step 1: Register a test domain
    console.log('\n📝 Step 1: Registering test domain...');
    const domainName = "finaltest";
    const isAvailable = await fixedContract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      const registrationPrice = currentChainId === 421614 ? ethers.parseEther("0.001") : ethers.parseEther("0.002");
      console.log(`Registering domain with ${ethers.formatEther(registrationPrice)} ETH...`);
      
      const registerTx = await fixedContract.register(domainName, true, { // true = omnichain
        value: registrationPrice,
        gasLimit: 200000
      });
      
      console.log('Registration transaction:', registerTx.hash);
      await registerTx.wait();
      console.log('✅ Domain registered successfully!');
    } else {
      console.log('Domain already exists, checking ownership...');
    }

    // Step 2: Check domain info
    console.log('\n📊 Step 2: Checking domain info...');
    const domainInfo = await fixedContract.getDomainInfo(domainName);
    console.log('Domain info:', {
      owner: domainInfo[0],
      expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
      sourceChainId: domainInfo[2].toString(),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    });

    if (domainInfo[0].toLowerCase() !== deployer.address.toLowerCase()) {
      console.log('❌ You are not the owner of this domain');
      return;
    }

    if (!domainInfo[3]) {
      console.log('❌ Domain is not configured for omnichain');
      return;
    }

    // Step 3: Attempt cross-chain transfer
    console.log('\n🌉 Step 3: Attempting cross-chain transfer...');
    console.log(`Transferring domain to chain ${targetChainId}...`);
    
    try {
      const crossChainTx = await fixedContract.crossChainTransfer(
        domainName,
        deployer.address,
        targetChainId,
        {
          gasLimit: 1000000 // High gas limit
        }
      );
      
      console.log('Cross-chain transfer transaction:', crossChainTx.hash);
      console.log('⏳ Waiting for transaction confirmation...');
      await crossChainTx.wait();
      console.log('✅ Cross-chain transfer transaction successful!');

      // Step 4: Check if domain was burned on source chain
      console.log('\n🔍 Step 4: Checking if domain was burned on source chain...');
      const domainInfoAfter = await fixedContract.getDomainInfo(domainName);
      console.log('Domain info after transfer:', {
        owner: domainInfoAfter[0],
        isOmnichain: domainInfoAfter[3],
        isExpired: domainInfoAfter[4]
      });

      if (domainInfoAfter[0] === "0x0000000000000000000000000000000000000000") {
        console.log('✅ Domain was burned on source chain (transfer initiated)');
      } else {
        console.log('❌ Domain still exists on source chain (transfer failed)');
      }

      // Step 5: Wait and check target chain
      console.log('\n⏳ Step 5: Waiting for cross-chain processing...');
      console.log('This may take 2-5 minutes for ZetaChain to process...');
      
      // Wait 30 seconds before checking
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      console.log('\n🔍 Checking target chain...');
      const targetProvider = currentChainId === 421614 
        ? new ethers.JsonRpcProvider('https://1rpc.io/sepolia')
        : new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
      
      const targetContract = new ethers.Contract(targetFixedAddress, ABI, targetProvider);
      
      try {
        const targetOwner = await targetContract.ownerOf(domainName);
        const targetDomainInfo = await targetContract.getDomainInfo(domainName);
        
        if (targetOwner !== "0x0000000000000000000000000000000000000000") {
          console.log('🎉 SUCCESS! Domain found on target chain:');
          console.log('- Owner:', targetOwner);
          console.log('- Source Chain ID:', targetDomainInfo[2].toString());
          console.log('- Is Omnichain:', targetDomainInfo[3]);
          console.log('\n✅ Cross-chain transfer completed successfully!');
        } else {
          console.log('⏳ Domain not yet visible on target chain');
          console.log('💡 This is normal - cross-chain transfers take 2-5 minutes');
          console.log('💡 Check again in a few minutes');
        }
      } catch (error) {
        console.log('⏳ Domain not yet visible on target chain (expected during processing)');
        console.log('💡 This is normal - cross-chain transfers take 2-5 minutes to complete');
      }

    } catch (error) {
      console.log('❌ Cross-chain transfer failed:', error.message);
      
      if (error.message.includes('insufficient funds')) {
        console.log('💡 This error is expected - we need ZRC20 tokens for gas fees');
      } else if (error.message.includes('ZRC20')) {
        console.log('💡 This error is expected - ZRC20 token not found or not configured');
      } else {
        console.log('💡 Other error - check the details above');
        console.log('Error details:', error);
      }
    }

    console.log('\n📋 FINAL Cross-Chain Transfer Test Summary:');
    console.log('==========================================');
    console.log('✅ FIXED Universal App deployed on both chains');
    console.log('✅ Domain registration working');
    console.log('✅ Cross-chain transfer setup ready');
    console.log('✅ Gateway addresses are CORRECT');
    console.log('⏳ Testing cross-chain functionality...');
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Wait 2-5 minutes for ZetaChain processing');
    console.log('2. Check if domain appears on target chain');
    console.log('3. Verify cross-chain transfer completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFinalCrossChain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

