const { ethers } = require('hardhat');

async function debugContractCall() {
  console.log('🔍 Debugging Contract Call...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Contract address
  const contractAddress = "0xE0AA86abfb00A6E33EA4d94C00eA3B8E06C8477f";
  
  // Contract ABI
  const contractABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external"
  ];

  try {
    const contract = new ethers.Contract(contractAddress, contractABI, deployer);
    
    console.log('🔧 Contract Configuration:');
    console.log('- Contract Address:', contractAddress);
    console.log('- Network:', network.name);
    console.log('- Chain ID:', currentChainId);

    // Test domain registration first
    console.log('\n📝 Testing domain registration...');
    const domainName = "debugtest";
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

    // Test cross-chain transfer
    console.log('\n🌉 Testing cross-chain transfer...');
    const targetChainId = 11155111; // Ethereum Sepolia
    
    try {
      // First, let's try to estimate gas
      console.log('Estimating gas for cross-chain transfer...');
      const gasEstimate = await contract.crossChainTransfer.estimateGas(
        domainName,
        deployer.address,
        targetChainId
      );
      console.log('Gas estimate:', gasEstimate.toString());

      const crossChainTx = await contract.crossChainTransfer(
        domainName,
        deployer.address,
        targetChainId,
        {
          gasLimit: gasEstimate + 50000n // Add some buffer
        }
      );
      
      console.log('Cross-chain transfer transaction:', crossChainTx.hash);
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await crossChainTx.wait();
      console.log('✅ Cross-chain transfer successful!');
      console.log('Gas used:', receipt.gasUsed.toString());

    } catch (error) {
      console.log('❌ Cross-chain transfer failed:', error.message);
      
      // Try to decode the error
      if (error.data) {
        console.log('Error data:', error.data);
      }
      
      if (error.reason) {
        console.log('Revert reason:', error.reason);
      }

      // Check if it's a specific error
      if (error.message.includes('ONLY_GATEWAY')) {
        console.log('💡 Error: Only gateway can call this function');
      } else if (error.message.includes('GATEWAY_ZERO')) {
        console.log('💡 Error: Gateway address is zero');
      } else if (error.message.includes('INVALID_RECIPIENT')) {
        console.log('💡 Error: Invalid recipient address');
      } else if (error.message.includes('SAME_CHAIN')) {
        console.log('💡 Error: Cannot transfer to same chain');
      } else if (error.message.includes('NOT_OWNER')) {
        console.log('💡 Error: Not the owner of the domain');
      } else if (error.message.includes('DOMAIN_EXPIRED')) {
        console.log('💡 Error: Domain has expired');
      } else if (error.message.includes('NOT_OMNICHAIN')) {
        console.log('💡 Error: Domain is not configured for omnichain');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugContractCall()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

