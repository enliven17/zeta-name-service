const { ethers } = require('hardhat');

async function testUniversalApp() {
  console.log('🧪 Testing Universal App Cross-Chain Transfer...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Universal App contract address (deployed on Arbitrum Sepolia)
  const universalAddress = "0xDD3dE3E2BD3952774A1cD996a534aCAB43363cFa";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId, address zrc20GasToken) external",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  try {
    const universalContract = new ethers.Contract(universalAddress, ABI, deployer);

    // Step 1: Check contract status
    console.log('📊 Step 1: Checking Universal App status...');
    const supportedChains = await universalContract.getSupportedChains();
    console.log('Supported chains:', supportedChains.map(id => id.toString()));

    // Step 2: Register a test domain
    console.log('\n📝 Step 2: Registering test domain...');
    const domainName = "universaltest";
    const isAvailable = await universalContract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      const registrationPrice = ethers.parseEther("0.001");
      console.log(`Registering domain with ${ethers.formatEther(registrationPrice)} ETH...`);
      
      const registerTx = await universalContract.register(domainName, true, { // true = omnichain
        value: registrationPrice,
        gasLimit: 200000
      });
      
      console.log('Registration transaction:', registerTx.hash);
      await registerTx.wait();
      console.log('✅ Domain registered successfully!');
    } else {
      console.log('Domain already exists, checking ownership...');
    }

    // Step 3: Check domain info
    console.log('\n📊 Step 3: Checking domain info...');
    const domainInfo = await universalContract.getDomainInfo(domainName);
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

    // Step 4: Test cross-chain transfer (simulation)
    console.log('\n🌉 Step 4: Testing cross-chain transfer setup...');
    const targetChainId = 11155111; // Ethereum Sepolia
    
    console.log(`Preparing cross-chain transfer to chain ${targetChainId}...`);
    console.log('Note: This requires ZRC20 gas token for the target chain');
    console.log('For now, we can only test the setup, not the actual transfer');
    
    // Check if we have the required ZRC20 token
    console.log('\n💡 Cross-Chain Transfer Requirements:');
    console.log('1. ✅ Universal App deployed and configured');
    console.log('2. ✅ Domain registered as omnichain');
    console.log('3. ⚠️  Need ZRC20 gas token for target chain');
    console.log('4. ⚠️  Need Universal App deployed on target chain');
    console.log('5. ⚠️  Need ZetaChain Gateway properly configured');

    console.log('\n📋 Current Status:');
    console.log('==================');
    console.log('✅ Universal App pattern implemented');
    console.log('✅ Contract deployed on Arbitrum Sepolia');
    console.log('✅ Domain registration working');
    console.log('⏳ Cross-chain transfer ready for testing');
    console.log('⏳ Need to deploy on Ethereum Sepolia');
    console.log('⏳ Need ZRC20 gas tokens for cross-chain calls');

    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Get more ETH for Ethereum Sepolia deployment');
    console.log('2. Deploy Universal App on Ethereum Sepolia');
    console.log('3. Get ZRC20 gas tokens for cross-chain calls');
    console.log('4. Test actual cross-chain transfers');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.data) {
      console.log('Error data:', error.data);
    }
    if (error.reason) {
      console.log('Revert reason:', error.reason);
    }
  }
}

testUniversalApp()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

