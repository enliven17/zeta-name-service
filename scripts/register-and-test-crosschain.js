const { ethers } = require('hardhat');

async function registerAndTestCrosschain() {
  console.log('🔍 Registering new domain and testing cross-chain transfer...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // FIXED Universal App contract addresses
  const arbFixedAddress = "0xb5980f90ab6c35e6D14a228553066C1D2D8C0cd7";
  const ethFixedAddress = "0x85c88B3F703df37E72cD68F292814cc5A571F73C";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  const domainName = "testcrosschain" + Date.now();
  const recipientAddress = "0xcc78505FE8707a1D85229BA0E7177aE26cE0f17D"; // Test recipient
  
  try {
    console.log('📝 Step 1: Registering domain on Arbitrum Sepolia...');
    const arbContract = new ethers.Contract(arbFixedAddress, ABI, deployer);
    
    // Register domain as omnichain
    const registrationPrice = ethers.parseEther("0.001");
    const registerTx = await arbContract.register(domainName, true, { // true = omnichain
      value: registrationPrice,
      gasLimit: 200000
    });
    
    console.log('Registration transaction:', registerTx.hash);
    console.log('⏳ Waiting for transaction confirmation...');
    await registerTx.wait();
    console.log('✅ Domain registered successfully!');
    
    // Check domain info
    console.log('\n📊 Domain info after registration:');
    const domainInfo = await arbContract.getDomainInfo(domainName);
    console.log('Domain info:', {
      owner: domainInfo[0],
      expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
      sourceChainId: domainInfo[2].toString(),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    });
    
    if (domainInfo[3]) {
      console.log('✅ Domain is omnichain enabled - ready for cross-chain transfer');
    } else {
      console.log('❌ Domain is NOT omnichain enabled - cannot transfer cross-chain');
      return;
    }
    
    console.log('\n📝 Step 2: Attempting cross-chain transfer to Ethereum Sepolia...');
    
    // Attempt cross-chain transfer
    const transferFee = ethers.parseEther("0.0001");
    const transferTx = await arbContract.crossChainTransfer(domainName, recipientAddress, 11155111, { // Ethereum Sepolia
      value: transferFee,
      gasLimit: 300000
    });
    
    console.log('Cross-chain transfer transaction:', transferTx.hash);
    console.log('⏳ Waiting for transaction confirmation...');
    await transferTx.wait();
    console.log('✅ Cross-chain transfer initiated successfully!');
    
    console.log('\n📝 Step 3: Checking domain status after transfer...');
    
    // Check if domain was burned on source chain (Arbitrum Sepolia)
    console.log('\n🔍 Arbitrum Sepolia (Source Chain):');
    const arbIsAvailable = await arbContract.isAvailable(domainName);
    console.log(`   Available: ${arbIsAvailable}`);
    
    if (arbIsAvailable) {
      console.log('   ✅ Domain was BURNED on source chain (transfer successful)');
    } else {
      console.log('   ❌ Domain still exists on source chain (transfer may have failed)');
    }
    
    // Check if domain was minted on target chain (Ethereum Sepolia)
    console.log('\n🔍 Ethereum Sepolia (Target Chain):');
    const ethContract = new ethers.Contract(ethFixedAddress, ABI, deployer);
    const ethIsAvailable = await ethContract.isAvailable(domainName);
    console.log(`   Available: ${ethIsAvailable}`);
    
    if (!ethIsAvailable) {
      const ethDomainInfo = await ethContract.getDomainInfo(domainName);
      console.log(`   Owner: ${ethDomainInfo[0]}`);
      console.log(`   Expires: ${new Date(Number(ethDomainInfo[1]) * 1000).toISOString()}`);
      console.log(`   Source Chain: ${ethDomainInfo[2].toString()}`);
      console.log(`   Is Omnichain: ${ethDomainInfo[3]}`);
      console.log(`   Is Expired: ${ethDomainInfo[4]}`);
      
      if (ethDomainInfo[0] === recipientAddress) {
        console.log('   ✅ Domain was MINTED on target chain with correct owner');
      } else {
        console.log('   ❌ Domain was minted but with wrong owner');
      }
    } else {
      console.log('   ❌ Domain was NOT minted on target chain (transfer failed)');
    }
    
    console.log('\n📋 Cross-Chain Transfer Test Summary:');
    console.log('====================================');
    console.log('Domain Name:', domainName + '.zeta');
    console.log('Source Chain: Arbitrum Sepolia (421614)');
    console.log('Target Chain: Ethereum Sepolia (11155111)');
    console.log('Recipient:', recipientAddress);
    console.log('');
    
    if (arbIsAvailable && !ethIsAvailable) {
      console.log('✅ CROSS-CHAIN TRANSFER SUCCESSFUL!');
      console.log('✅ Domain was burned on source chain');
      console.log('✅ Domain was minted on target chain');
    } else if (!arbIsAvailable && !ethIsAvailable) {
      console.log('❌ CROSS-CHAIN TRANSFER FAILED!');
      console.log('❌ Domain exists on both chains (not burned)');
    } else if (arbIsAvailable && ethIsAvailable) {
      console.log('❌ CROSS-CHAIN TRANSFER FAILED!');
      console.log('❌ Domain was burned but not minted');
    } else {
      console.log('❓ CROSS-CHAIN TRANSFER STATUS UNCLEAR');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

registerAndTestCrosschain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
