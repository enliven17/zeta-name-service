const { ethers } = require('hardhat');

async function deployFixedUniversal() {
  console.log('🚀 Deploying FIXED Universal Name Service...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('📋 Deployment Details:');
  console.log('- Deployer address:', deployer.address);
  console.log('- Network:', network.name);
  console.log('- Chain ID:', currentChainId);
  console.log('- Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

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
  
  console.log('🔧 Gateway Configuration:');
  console.log('- Gateway Address:', gatewayAddress);

  try {
    console.log('\n📦 Deploying FIXED Universal Name Service...');
    const ZetaUniversalNameServiceFixed = await ethers.getContractFactory("ZetaUniversalNameServiceFixed");
    const contract = await ZetaUniversalNameServiceFixed.deploy(gatewayAddress);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log('✅ FIXED Universal Name Service deployed to:', contractAddress);
    
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
    const filename = `deployments/fixed-universal-deployment-${currentChainId}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to:', filename);
    
    console.log('\n🎉 FIXED Universal Name Service deployment completed successfully!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy on both chains (Arbitrum Sepolia, Ethereum Sepolia)');
    console.log('2. Test cross-chain transfers with FIXED implementation');
    console.log('3. Verify cross-chain functionality works');
    
    console.log('\n🔗 Contract Addresses:');
    console.log('FIXED Universal Name Service:', contractAddress);
    console.log('Gateway:', gatewayAddress);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployFixedUniversal()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

