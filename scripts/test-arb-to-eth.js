const { ethers } = require('hardhat');

async function testArbToEthTransfer() {
  console.log('🚀 Testing ARB Sepolia to ETH Sepolia Cross-Chain Transfer...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Contract addresses
  const arbContractAddress = "0xAaFE053F1D8402282c839aeb595218F30aa7DCC6";
  const ethContractAddress = "0x6783fB75e995Af777026141C68baee68a8C68c70";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable"
  ];

  try {
    // Step 1: Register domain on Arbitrum Sepolia
    console.log('📝 Step 1: Registering domain on Arbitrum Sepolia...');
    const arbContract = new ethers.Contract(arbContractAddress, ABI, deployer);
    
    const domainName = "arbtoethtest";
    const isAvailable = await arbContract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      const registrationPrice = ethers.parseEther("0.001"); // ARB Sepolia price
      console.log(`Registering domain with ${ethers.formatEther(registrationPrice)} ETH...`);
      
      const registerTx = await arbContract.register(domainName, true, { // true = omnichain
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
    const domainInfo = await arbContract.getDomainInfo(domainName);
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

    // Step 3: Cross-chain transfer to Ethereum Sepolia
    console.log('\n🌉 Step 3: Initiating cross-chain transfer to Ethereum Sepolia...');
    const targetChainId = 11155111; // Ethereum Sepolia
    const transferFee = ethers.parseEther("0.0001"); // ARB Sepolia transfer fee
    
    console.log(`Transferring to chain ${targetChainId} with ${ethers.formatEther(transferFee)} ETH fee...`);
    
    const crossChainTx = await arbContract.crossChainTransfer(
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

    // Step 4: Wait and check on Ethereum Sepolia
    console.log('\n⏳ Step 4: Waiting for cross-chain processing (2-5 minutes)...');
    console.log('This may take some time as ZetaChain processes the cross-chain message...');
    
    // Wait 30 seconds before checking
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\n🔍 Checking on Ethereum Sepolia...');
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const ethContract = new ethers.Contract(ethContractAddress, ABI, ethProvider);
    
    try {
      const ethOwner = await ethContract.ownerOf(domainName);
      const ethDomainInfo = await ethContract.getDomainInfo(domainName);
      
      if (ethOwner !== "0x0000000000000000000000000000000000000000") {
        console.log('✅ SUCCESS! Domain found on Ethereum Sepolia:');
        console.log('- Owner:', ethOwner);
        console.log('- Source Chain ID:', ethDomainInfo[2].toString());
        console.log('- Is Omnichain:', ethDomainInfo[3]);
        console.log('\n🎉 Cross-chain transfer completed successfully!');
      } else {
        console.log('⏳ Domain not yet visible on Ethereum Sepolia. This is normal - it may take 2-5 minutes.');
        console.log('💡 Check again in a few minutes using: node scripts/check-domain-owner.js');
      }
    } catch (error) {
      console.log('⏳ Domain not yet visible on Ethereum Sepolia (expected during processing)');
      console.log('💡 This is normal - cross-chain transfers take 2-5 minutes to complete');
    }

    console.log('\n📋 Summary:');
    console.log('1. ✅ Domain registered on Arbitrum Sepolia');
    console.log('2. ✅ Cross-chain transfer initiated');
    console.log('3. ⏳ Waiting for ZetaChain processing');
    console.log('4. 🔍 Check Ethereum Sepolia in 2-5 minutes');

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

testArbToEthTransfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

