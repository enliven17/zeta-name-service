const { ethers } = require('hardhat');

async function testEthToArbTransfer() {
  console.log('🚀 Testing ETH Sepolia to ARB Sepolia Cross-Chain Transfer...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Contract addresses
  const ethContractAddress = "0x6783fB75e995Af777026141C68baee68a8C68c70";
  const arbContractAddress = "0xAaFE053F1D8402282c839aeb595218F30aa7DCC6";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable"
  ];

  try {
    // Step 1: Register domain on Ethereum Sepolia
    console.log('📝 Step 1: Registering domain on Ethereum Sepolia...');
    const ethContract = new ethers.Contract(ethContractAddress, ABI, deployer);
    
    const domainName = "testcrosschain";
    const isAvailable = await ethContract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      const registrationPrice = ethers.parseEther("0.002"); // ETH Sepolia price
      console.log(`Registering domain with ${ethers.formatEther(registrationPrice)} ETH...`);
      
      const registerTx = await ethContract.register(domainName, true, { // true = omnichain
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
    const domainInfo = await ethContract.getDomainInfo(domainName);
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

    // Step 3: Cross-chain transfer to Arbitrum Sepolia
    console.log('\n🌉 Step 3: Initiating cross-chain transfer to Arbitrum Sepolia...');
    const targetChainId = 421614; // Arbitrum Sepolia
    const transferFee = ethers.parseEther("0.0002"); // ETH Sepolia transfer fee
    
    console.log(`Transferring to chain ${targetChainId} with ${ethers.formatEther(transferFee)} ETH fee...`);
    
    const crossChainTx = await ethContract.crossChainTransfer(
      domainName,
      deployer.address,
      targetChainId,
      {
        value: transferFee,
        gasLimit: 500000
      }
    );
    
    console.log('Cross-chain transfer transaction:', crossChainTx.hash);
    console.log('⏳ Waiting for transaction confirmation...');
    await crossChainTx.wait();
    console.log('✅ Cross-chain transfer initiated successfully!');

    // Step 4: Wait and check on Arbitrum Sepolia
    console.log('\n⏳ Step 4: Waiting for cross-chain processing (2-5 minutes)...');
    console.log('This may take some time as ZetaChain processes the cross-chain message...');
    
    // Wait 30 seconds before checking
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\n🔍 Checking on Arbitrum Sepolia...');
    const arbProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const arbContract = new ethers.Contract(arbContractAddress, ABI, arbProvider);
    
    try {
      const arbOwner = await arbContract.ownerOf(domainName);
      const arbDomainInfo = await arbContract.getDomainInfo(domainName);
      
      if (arbOwner !== "0x0000000000000000000000000000000000000000") {
        console.log('✅ SUCCESS! Domain found on Arbitrum Sepolia:');
        console.log('- Owner:', arbOwner);
        console.log('- Source Chain ID:', arbDomainInfo[2].toString());
        console.log('- Is Omnichain:', arbDomainInfo[3]);
        console.log('\n🎉 Cross-chain transfer completed successfully!');
      } else {
        console.log('⏳ Domain not yet visible on Arbitrum Sepolia. This is normal - it may take 2-5 minutes.');
        console.log('💡 Check again in a few minutes using: node scripts/check-domain-owner.js');
      }
    } catch (error) {
      console.log('⏳ Domain not yet visible on Arbitrum Sepolia (expected during processing)');
      console.log('💡 This is normal - cross-chain transfers take 2-5 minutes to complete');
    }

    console.log('\n📋 Summary:');
    console.log('1. ✅ Domain registered on Ethereum Sepolia');
    console.log('2. ✅ Cross-chain transfer initiated');
    console.log('3. ⏳ Waiting for ZetaChain processing');
    console.log('4. 🔍 Check Arbitrum Sepolia in 2-5 minutes');

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

testEthToArbTransfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

