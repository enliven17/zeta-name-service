const { ethers } = require('hardhat');

async function deployCorrectUniversal() {
  console.log('🚀 Deploying Correct Universal Name Service...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('📋 Deployment Details:');
  console.log('- Deployer address:', deployer.address);
  console.log('- Network:', network.name);
  console.log('- Chain ID:', currentChainId);
  console.log('- Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  // Gateway address (same for all chains)
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
  
  console.log('🔧 Gateway Configuration:');
  console.log('- Gateway Address:', gatewayAddress);

  try {
    console.log('\n📦 Deploying Correct Universal Name Service...');
    const ZetaUniversalNameServiceCorrect = await ethers.getContractFactory("ZetaUniversalNameServiceCorrect");
    const contract = await ZetaUniversalNameServiceCorrect.deploy(gatewayAddress);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log('✅ Correct Universal Name Service deployed to:', contractAddress);
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const testDomain = "test";
    const owner = await contract.ownerOf(testDomain);
    console.log('Contract is responding (test domain owner):', owner);
    
    const supportedChains = await contract.getSupportedChains();
    console.log('Supported chains:', supportedChains.map(c => c.toString()));
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress: contractAddress,
      gatewayAddress: gatewayAddress,
      deployer: deployer.address,
      network: network.name,
      chainId: currentChainId,
      timestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    const filename = `deployments/correct-universal-deployment-${currentChainId}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to:', filename);
    
    console.log('\n🎉 Correct Universal Name Service deployment completed successfully!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy on both chains (Arbitrum Sepolia, Ethereum Sepolia)');
    console.log('2. Test cross-chain transfers with correct implementation');
    console.log('3. Verify cross-chain functionality works');
    
    console.log('\n🔗 Contract Addresses:');
    console.log('Correct Universal Name Service:', contractAddress);
    console.log('Gateway:', gatewayAddress);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployCorrectUniversal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

