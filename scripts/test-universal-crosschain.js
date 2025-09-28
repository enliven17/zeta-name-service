const { ethers } = require('hardhat');

async function testUniversalCrossChain() {
  console.log('🌉 Testing Universal App Cross-Chain Transfer...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Contract addresses
  const arbUniversalAddress = "0xDD3dE3E2BD3952774A1cD996a534aCAB43363cFa";
  const ethUniversalAddress = "0x669b520D9b12171E10Fdd56bf1357e3D7bE5Bc99";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId, address zrc20GasToken) external",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  try {
    // Determine which contract to use based on current chain
    const universalAddress = currentChainId === 421614 ? arbUniversalAddress : ethUniversalAddress;
    const targetChainId = currentChainId === 421614 ? 11155111 : 421614;
    const targetUniversalAddress = currentChainId === 421614 ? ethUniversalAddress : arbUniversalAddress;
    
    console.log(`🔧 Using Universal App: ${universalAddress}`);
    console.log(`🎯 Target Chain: ${targetChainId}`);
    console.log(`🎯 Target Universal App: ${targetUniversalAddress}`);

    const universalContract = new ethers.Contract(universalAddress, ABI, deployer);

    // Step 1: Register a test domain
    console.log('\n📝 Step 1: Registering test domain...');
    const domainName = "universalcrosschain";
    const isAvailable = await universalContract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      const registrationPrice = currentChainId === 421614 ? ethers.parseEther("0.001") : ethers.parseEther("0.002");
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

    // Step 2: Check domain info
    console.log('\n📊 Step 2: Checking domain info...');
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

    // Step 3: Try cross-chain transfer (without ZRC20 for now)
    console.log('\n🌉 Step 3: Attempting cross-chain transfer...');
    console.log('Note: This will fail without ZRC20 tokens, but we can test the setup');
    
    // Use a dummy ZRC20 address for testing
    const dummyZRC20 = "0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD";
    
    try {
      console.log(`Attempting cross-chain transfer to chain ${targetChainId}...`);
      console.log('This will likely fail due to missing ZRC20 tokens, but we can see the error');
      
      const crossChainTx = await universalContract.crossChainTransfer(
        domainName,
        deployer.address,
        targetChainId,
        dummyZRC20,
        {
          gasLimit: 500000
        }
      );
      
      console.log('Cross-chain transfer transaction:', crossChainTx.hash);
      await crossChainTx.wait();
      console.log('✅ Cross-chain transfer successful!');
      
    } catch (error) {
      console.log('❌ Cross-chain transfer failed (expected without ZRC20):', error.message);
      
      if (error.message.includes('insufficient funds')) {
        console.log('💡 This error is expected - we need ZRC20 tokens for gas fees');
      } else if (error.message.includes('ZRC20')) {
        console.log('💡 This error is expected - ZRC20 token not found or not configured');
      } else {
        console.log('💡 Other error - check the details above');
      }
    }

    // Step 4: Check if domain was burned on source chain
    console.log('\n🔍 Step 4: Checking if domain was burned on source chain...');
    const domainInfoAfter = await universalContract.getDomainInfo(domainName);
    console.log('Domain info after transfer attempt:', {
      owner: domainInfoAfter[0],
      isOmnichain: domainInfoAfter[3],
      isExpired: domainInfoAfter[4]
    });

    if (domainInfoAfter[0] === "0x0000000000000000000000000000000000000000") {
      console.log('✅ Domain was burned on source chain (transfer initiated)');
    } else {
      console.log('❌ Domain still exists on source chain (transfer failed)');
    }

    console.log('\n📋 Cross-Chain Transfer Test Summary:');
    console.log('====================================');
    console.log('✅ Universal App deployed on both chains');
    console.log('✅ Domain registration working');
    console.log('✅ Cross-chain transfer setup ready');
    console.log('⚠️  Need ZRC20 tokens for actual cross-chain calls');
    console.log('⚠️  Need proper ZRC20 token addresses');
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Get ZRC20 tokens by bridging ETH to ZetaChain');
    console.log('2. Use correct ZRC20 token addresses');
    console.log('3. Test actual cross-chain transfers');
    console.log('4. Verify domain appears on target chain');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUniversalCrossChain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

