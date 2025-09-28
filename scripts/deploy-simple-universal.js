const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Simplified Universal Name Service...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Details:");
  console.log("- Deployer address:", deployer.address);
  console.log("- Network:", network.name);
  console.log("- Chain ID:", network.chainId.toString());
  console.log("- Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ZetaChain Gateway addresses by network
  const gatewayAddresses = {
    421614: "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Arbitrum Sepolia Gateway
    11155111: "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Ethereum Sepolia Gateway  
    7001: "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // ZetaChain Athens Gateway
  };

  const currentChainId = Number(network.chainId);
  const gatewayAddress = gatewayAddresses[currentChainId];

  if (!gatewayAddress) {
    throw new Error(`Gateway address not found for chain ID ${currentChainId}`);
  }

  console.log("🔧 Gateway Configuration:");
  console.log("- Gateway Address:", gatewayAddress);

  try {
    // Deploy Simplified Universal Name Service
    console.log("\n📦 Deploying Simplified Universal Name Service...");
    const SimpleUniversalNameService = await ethers.getContractFactory("ZetaUniversalNameServiceSimple");
    
    const simpleUniversalNameService = await SimpleUniversalNameService.deploy(gatewayAddress);
    await simpleUniversalNameService.waitForDeployment();
    
    const simpleAddress = await simpleUniversalNameService.getAddress();
    console.log("✅ Simplified Universal Name Service deployed to:", simpleAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await simpleUniversalNameService.ownerOf("test");
    console.log("Contract is responding (test domain owner):", owner);

    // Get supported chains
    const supportedChains = await simpleUniversalNameService.getSupportedChains();
    console.log("Supported chains:", supportedChains.map(id => id.toString()));

    // Save deployment info
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
        rpc: "N/A"
      },
      contracts: {
        ZetaUniversalNameServiceSimple: simpleAddress
      },
      configuration: {
        gateway: gatewayAddress,
        registrationPrice: currentChainId === 11155111 ? "0.002" : "0.001",
        transferFee: "0.0001"
      },
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      supportedChains: [
        {
          chainId: 421614,
          name: "Arbitrum Sepolia",
          explorer: "https://sepolia.arbiscan.io"
        },
        {
          chainId: 11155111,
          name: "Ethereum Sepolia", 
          explorer: "https://sepolia.etherscan.io"
        }
      ]
    };

    // Save to deployments folder
    const deploymentFile = `deployments/simple-universal-deployment-${currentChainId}-${Date.now()}.json`;
    const deploymentsDir = path.dirname(deploymentFile);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 Simplified Universal Name Service deployment completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Deploy on both chains (Arbitrum Sepolia, Ethereum Sepolia)");
    console.log("2. Test cross-chain transfers without ZRC20");
    console.log("3. Verify cross-chain functionality works");

    console.log("\n🔗 Contract Addresses:");
    console.log(`Simplified Universal Name Service: ${simpleAddress}`);
    console.log(`Gateway: ${gatewayAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

