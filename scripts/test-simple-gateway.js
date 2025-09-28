const { ethers } = require('hardhat');

async function testSimpleGateway() {
  console.log('🧪 Testing Simple Gateway Contract...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Gateway address
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";

  try {
    // Deploy simple test contract
    console.log('📦 Deploying SimpleGatewayTest contract...');
    const SimpleGatewayTest = await ethers.getContractFactory("SimpleGatewayTest");
    const simpleContract = await SimpleGatewayTest.deploy(gatewayAddress);
    await simpleContract.waitForDeployment();
    const contractAddress = await simpleContract.getAddress();
    
    console.log('✅ SimpleGatewayTest deployed to:', contractAddress);
    
    // Test the call
    console.log('\n🧪 Testing gateway call...');
    const tx = await simpleContract.testCall({
      gasLimit: 200000
    });
    
    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Gateway call successful!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.receipt) {
      console.log('Receipt status:', error.receipt.status);
      console.log('Gas used:', error.receipt.gasUsed.toString());
    }
  }
}

testSimpleGateway()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

