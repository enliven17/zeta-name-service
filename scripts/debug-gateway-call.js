const { ethers } = require('hardhat');

async function debugGatewayCall() {
  console.log('🔍 Debugging Gateway Call...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Gateway address
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
  
  // Gateway ABI
  const gatewayABI = [
    "function call(address receiver, bytes calldata payload, tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions) external payable"
  ];

  try {
    const gateway = new ethers.Contract(gatewayAddress, gatewayABI, deployer);
    
    console.log('🔧 Gateway Configuration:');
    console.log('- Gateway Address:', gatewayAddress);
    console.log('- Network:', network.name);
    console.log('- Chain ID:', currentChainId);

    // Test simple call
    console.log('\n🧪 Testing simple gateway call...');
    
    const testReceiver = deployer.address; // Call ourselves
    const testPayload = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string"], 
      ["test message"]
    );
    
    const revertOptions = {
      revertAddress: deployer.address,
      callOnRevert: false,
      abortAddress: deployer.address,
      revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test revert"]),
      onRevertGasLimit: 0
    };

    console.log('Call parameters:');
    console.log('- Receiver:', testReceiver);
    console.log('- Payload length:', testPayload.length);
    console.log('- Revert options:', revertOptions);

    try {
      const tx = await gateway.call(
        testReceiver,
        testPayload,
        revertOptions,
        {
          value: 0,
          gasLimit: 200000
        }
      );
      
      console.log('✅ Gateway call successful!');
      console.log('Transaction hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
    } catch (error) {
      console.log('❌ Gateway call failed:', error.message);
      
      // Try to get more details
      if (error.data) {
        console.log('Error data:', error.data);
      }
      
      // Check if it's a revert with reason
      if (error.reason) {
        console.log('Revert reason:', error.reason);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugGatewayCall()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

