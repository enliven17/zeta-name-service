const { ethers } = require('hardhat');

async function debugContractInternal() {
  console.log('🔍 Debugging Contract Internal...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Contract address
  const contractAddress = "0xE0AA86abfb00A6E33EA4d94C00eA3B8E06C8477f";
  
  // Contract ABI with more functions
  const contractABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);
    
    console.log('🔧 Contract Configuration:');
    console.log('- Contract Address:', contractAddress);
    console.log('- Network:', network.name);
    console.log('- Chain ID:', currentChainId);

    // Check contract state
    console.log('\n📊 Checking contract state...');
    const supportedChains = await contract.getSupportedChains();
    console.log('Supported chains:', supportedChains.map(c => c.toString()));

    // Test domain registration
    console.log('\n📝 Testing domain registration...');
    const domainName = "internaldebug";
    const isAvailable = await contract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
      const registrationPrice = ethers.parseEther("0.001");
      console.log(`Registering domain with ${ethers.formatEther(registrationPrice)} ETH...`);
      
      const registerTx = await contract.register(domainName, true, {
        value: registrationPrice,
        gasLimit: 200000
      });
      
      console.log('Registration transaction:', registerTx.hash);
      await registerTx.wait();
      console.log('✅ Domain registered successfully!');
    }

    // Check domain info
    console.log('\n📊 Checking domain info...');
    const domainInfo = await contract.getDomainInfo(domainName);
    console.log('Domain info:', {
      owner: domainInfo[0],
      expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
      sourceChainId: domainInfo[2].toString(),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    });

    // Test cross-chain transfer with detailed error handling
    console.log('\n🌉 Testing cross-chain transfer with detailed error handling...');
    const targetChainId = 11155111; // Ethereum Sepolia
    
    try {
      // Try to call the function directly
      console.log('Calling crossChainTransfer function...');
      
      const crossChainTx = await contract.crossChainTransfer(
        domainName,
        deployer.address,
        targetChainId,
        {
          gasLimit: 1000000 // High gas limit
        }
      );
      
      console.log('Cross-chain transfer transaction:', crossChainTx.hash);
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await crossChainTx.wait();
      console.log('✅ Cross-chain transfer successful!');
      console.log('Gas used:', receipt.gasUsed.toString());

    } catch (error) {
      console.log('❌ Cross-chain transfer failed:');
      console.log('Error message:', error.message);
      
      // Try to get more details
      if (error.data) {
        console.log('Error data:', error.data);
      }
      
      if (error.reason) {
        console.log('Revert reason:', error.reason);
      }

      // Check transaction details
      if (error.transaction) {
        console.log('Transaction details:', error.transaction);
      }

      // Check receipt details
      if (error.receipt) {
        console.log('Receipt details:', error.receipt);
        console.log('Status:', error.receipt.status);
        console.log('Gas used:', error.receipt.gasUsed.toString());
      }

      // Try to decode the error
      try {
        const errorData = error.data || error.receipt?.logs?.[0]?.data;
        if (errorData && errorData !== '0x') {
          console.log('Raw error data:', errorData);
          
          // Try to decode as string
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], errorData);
            console.log('Decoded error:', decoded[0]);
          } catch (decodeError) {
            console.log('Could not decode error data');
          }
        }
      } catch (decodeError) {
        console.log('Error decoding failed:', decodeError.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugContractInternal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

