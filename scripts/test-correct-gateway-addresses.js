const { ethers } = require('hardhat');

async function testCorrectGatewayAddresses() {
  console.log('🎯 Testing Correct Gateway Addresses from ZetaChain Docs...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Doğru Gateway adresleri (ZetaChain dokümantasyonundan)
  const correctGateways = {
    421614: "0x0dA86Dc3F9B71F84a0E97B0e2291e50B7a5df10f", // Arbitrum Sepolia
    11155111: "0x0c487a766110c85d301d96e33579c5b317fa4995"  // Ethereum Sepolia
  };

  const gatewayAddress = correctGateways[currentChainId];
  
  if (!gatewayAddress) {
    console.log('❌ No Gateway address found for chain ID:', currentChainId);
    return;
  }

  console.log('🔧 Using Correct Gateway Address:', gatewayAddress);

  // Gateway ABI
  const gatewayABI = [
    "function call(address receiver, bytes calldata payload, tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions) external payable"
  ];

  try {
    const gateway = new ethers.Contract(gatewayAddress, gatewayABI, deployer);
    
    // Test Gateway call
    console.log('\n🧪 Testing Gateway Call...');
    
    const revertOptions = {
      revertAddress: deployer.address,
      callOnRevert: false,
      abortAddress: deployer.address,
      revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test revert"]),
      onRevertGasLimit: 0
    };

    const testPayload = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"], 
      ["test message"]
    );

    const tx = await gateway.call(
      deployer.address, // receiver
      testPayload,      // payload
      revertOptions,    // revertOptions
      {
        value: 0,
        gasLimit: 200000
      }
    );
    
    console.log('✅ Gateway call successful!');
    console.log('Transaction hash:', tx.hash);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Transaction confirmed!');
    
    console.log('\n🎉 SUCCESS! Correct Gateway address works!');
    console.log('Gateway Address:', gatewayAddress);
    console.log('Chain ID:', currentChainId);
    
  } catch (error) {
    console.log('❌ Gateway call failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('💡 This error is expected - we need ZRC20 tokens for gas fees');
    } else if (error.message.includes('ZRC20')) {
      console.log('💡 This error is expected - ZRC20 token not found or not configured');
    } else {
      console.log('💡 Other error - check the details above');
      console.log('Error details:', error);
    }
  }
}

testCorrectGatewayAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

