const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ZetaChain Universal Name Service...\n");

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
    // Deploy Universal Name Service
    console.log("\n📦 Deploying Universal Name Service...");
    const UniversalNameService = await ethers.getContractFactory("ZetaUniversalNameService");
    
    const universalNameService = await UniversalNameService.deploy(gatewayAddress);
    await universalNameService.waitForDeployment();
    
    const universalAddress = await universalNameService.getAddress();
    console.log("✅ Universal Name Service deployed to:", universalAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await universalNameService.ownerOf("test");
    console.log("Contract is responding (test domain owner):", owner);

    // Get supported chains
    const supportedChains = await universalNameService.getSupportedChains();
    console.log("Supported chains:", supportedChains.map(id => id.toString()));

    // Save deployment info
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
        rpc: "N/A"
      },
      contracts: {
        ZetaUniversalNameService: universalAddress
      },
      configuration: {
        gateway: gatewayAddress,
        registrationPrice: "0.001",
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
    const deploymentFile = `deployments/universal-deployment-${currentChainId}-${Date.now()}.json`;
    const deploymentsDir = path.dirname(deploymentFile);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 Universal Name Service deployment completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Deploy on all supported chains (Arbitrum Sepolia, Ethereum Sepolia)");
    console.log("2. Test cross-chain transfers between chains");
    console.log("3. Update frontend to use Universal App pattern");
    console.log("4. Test with real ZetaChain Gateway");

    console.log("\n🔗 Contract Addresses:");
    console.log(`Universal Name Service: ${universalAddress}`);
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

