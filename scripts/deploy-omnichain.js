const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting ZetaChain Omnichain Name Service Deployment...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📋 Deployment Details:");
  console.log("- Deployer address:", deployer.address);
  console.log("- Network:", network.name);
  console.log("- Chain ID:", network.chainId.toString());
  console.log("- Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ZetaChain configuration by network
  const zetaConfig = {
    421614: { // Arbitrum Sepolia
      connector: "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67", // ZetaChain Connector on Arbitrum Sepolia
      token: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // ZETA token on Arbitrum Sepolia
      tss: "0x70e967acFcC17c3941E87562161406d41676FD83" // TSS address
    },
    7001: { // ZetaChain Testnet
      connector: "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67", // ZetaChain Connector on ZetaChain
      token: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // ZETA token on ZetaChain
      tss: "0x70e967acFcC17c3941E87562161406d41676FD83" // TSS address
    },
    11155111: { // Ethereum Sepolia
      connector: "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67", // ZetaChain Connector on Ethereum Sepolia
      token: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // ZETA token on Ethereum Sepolia
      tss: "0x70e967acFcC17c3941E87562161406d41676FD83" // TSS address
    }
  };

  // Deployment configuration based on network
  const deploymentConfig = {
    421614: { // Arbitrum Sepolia
      name: "Arbitrum Sepolia",
      registrationPrice: ethers.parseEther("0.001"),
      transferFee: ethers.parseEther("0.0001"),
      listingFee: ethers.parseEther("0.0001"),
    },
    7001: { // ZetaChain Testnet
      name: "ZetaChain Athens Testnet",
      registrationPrice: ethers.parseEther("0.001"),
      transferFee: ethers.parseEther("0.0001"),
      listingFee: ethers.parseEther("0.0001"),
    },
    11155111: { // Ethereum Sepolia
      name: "Ethereum Sepolia",
      registrationPrice: ethers.parseEther("0.002"),
      transferFee: ethers.parseEther("0.0002"),
      listingFee: ethers.parseEther("0.0002"),
    }
  };

  const config = deploymentConfig[network.chainId.toString()] || deploymentConfig[421614];
  console.log(`🌐 Deploying on ${config.name}`);
  console.log(`💰 Registration Price: ${ethers.formatEther(config.registrationPrice)} ETH`);
  console.log(`🔄 Transfer Fee: ${ethers.formatEther(config.transferFee)} ETH\n`);

  try {
    // 1. Deploy ZetaOmnichainNameService
    console.log("📝 Deploying ZetaOmnichainNameService...");
    
    // Get ZetaChain configuration for current network
    const currentZetaConfig = zetaConfig[network.chainId.toString()];
    if (!currentZetaConfig) {
      throw new Error(`ZetaChain configuration not found for chain ID: ${network.chainId}`);
    }
    
    console.log("🔗 Using ZetaChain config:");
    console.log("- Connector:", currentZetaConfig.connector);
    console.log("- Token:", currentZetaConfig.token);
    console.log("- TSS:", currentZetaConfig.tss);
    
    const ZetaOmnichainNameService = await ethers.getContractFactory("ZetaOmnichainNameService");
    const nameService = await ZetaOmnichainNameService.deploy(
      deployer.address,
      currentZetaConfig.connector,
      currentZetaConfig.token,
      currentZetaConfig.tss
    );
    await nameService.waitForDeployment();
    const nameServiceAddress = await nameService.getAddress();
    
    console.log("✅ ZetaOmnichainNameService deployed to:", nameServiceAddress);

    // 2. Deploy ZetaOmnichainMarketplace
    console.log("📝 Deploying ZetaOmnichainMarketplace...");
    const ZetaOmnichainMarketplace = await ethers.getContractFactory("ZetaOmnichainMarketplace");
    const marketplace = await ZetaOmnichainMarketplace.deploy(nameServiceAddress, deployer.address);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    
    console.log("✅ ZetaOmnichainMarketplace deployed to:", marketplaceAddress);

    // 3. Configure cross-chain support
    console.log("\n🔧 Configuring cross-chain support...");
    
    // Add supported chains to name service
    const supportedChains = [
      { chainId: 421614, name: "Arbitrum Sepolia", rpc: "https://sepolia-rollup.arbitrum.io/rpc", explorer: "https://sepolia.arbiscan.io" },
      { chainId: 7001, name: "ZetaChain Testnet", rpc: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public", explorer: "https://athens.explorer.zetachain.com" },
      { chainId: 11155111, name: "Ethereum Sepolia", rpc: "https://sepolia.infura.io/v3/YOUR_KEY", explorer: "https://sepolia.etherscan.io" },
      { chainId: 97, name: "BSC Testnet", rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", explorer: "https://testnet.bscscan.com" },
      { chainId: 80001, name: "Polygon Mumbai", rpc: "https://rpc-mumbai.maticvigil.com", explorer: "https://mumbai.polygonscan.com" }
    ];

    for (const chain of supportedChains) {
      if (chain.chainId !== network.chainId) {
        try {
          console.log(`- Adding support for ${chain.name} (${chain.chainId})`);
          const tx = await nameService.addSupportedChain(
            chain.chainId,
            config.registrationPrice,
            config.transferFee,
            chain.rpc,
            chain.explorer
          );
          await tx.wait();
          console.log(`  ✅ ${chain.name} support added`);
        } catch (error) {
          console.log(`  ⚠️  Failed to add ${chain.name}: ${error.message}`);
        }
      }
    }

    // Configure marketplace for supported chains
    console.log("\n🏪 Configuring marketplace for cross-chain trading...");
    for (const chain of supportedChains) {
      if (chain.chainId !== network.chainId) {
        try {
          const tx = await marketplace.updateChainSupport(chain.chainId, true, config.listingFee);
          await tx.wait();
          console.log(`- ${chain.name} marketplace support enabled`);
        } catch (error) {
          console.log(`- ⚠️  Failed to configure marketplace for ${chain.name}: ${error.message}`);
        }
      }
    }

    // 4. Set ZetaChain configuration (if available)
    if (process.env.NEXT_PUBLIC_ZETA_CONNECTOR_ADDRESS && process.env.NEXT_PUBLIC_ZETA_TOKEN_ADDRESS) {
      console.log("\n🔗 Setting ZetaChain configuration...");
      try {
        const zetaTx = await nameService.setZetaConfig(
          process.env.NEXT_PUBLIC_ZETA_CONNECTOR_ADDRESS,
          process.env.NEXT_PUBLIC_ZETA_TOKEN_ADDRESS,
          process.env.NEXT_PUBLIC_TSS_ADDRESS || ethers.ZeroAddress
        );
        await zetaTx.wait();
        console.log("✅ ZetaChain configuration set");

        const marketplaceZetaTx = await marketplace.setZetaConfig(
          process.env.NEXT_PUBLIC_ZETA_CONNECTOR_ADDRESS,
          process.env.NEXT_PUBLIC_ZETA_TOKEN_ADDRESS
        );
        await marketplaceZetaTx.wait();
        console.log("✅ Marketplace ZetaChain configuration set");
      } catch (error) {
        console.log("⚠️  ZetaChain configuration failed:", error.message);
      }
    }

    // 5. Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    // Test name service functions
    const isAvailable = await nameService.isAvailable("test");
    console.log("- Name service availability check:", isAvailable);
    
    const supportedChainsResult = await nameService.getSupportedChains();
    console.log("- Supported chains:", supportedChainsResult.map(id => id.toString()));

    // Test marketplace functions
    const marketplaceSupportedChains = await marketplace.getSupportedChains();
    console.log("- Marketplace supported chains:", marketplaceSupportedChains.map(id => id.toString()));

    // 6. Save deployment information
    const deploymentInfo = {
      network: {
        name: config.name,
        chainId: network.chainId.toString(),
        rpc: config.rpc || "N/A"
      },
      contracts: {
        ZetaOmnichainNameService: nameServiceAddress,
        ZetaOmnichainMarketplace: marketplaceAddress
      },
      configuration: {
        registrationPrice: ethers.formatEther(config.registrationPrice),
        transferFee: ethers.formatEther(config.transferFee),
        listingFee: ethers.formatEther(config.listingFee)
      },
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      supportedChains: supportedChains.map(chain => ({
        chainId: chain.chainId,
        name: chain.name,
        explorer: chain.explorer
      }))
    };

    // Save to file
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `omnichain-deployment-${network.chainId}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📄 Deployment Summary:");
    console.log("=".repeat(50));
    console.log(`Network: ${config.name} (${network.chainId})`);
    console.log(`Name Service: ${nameServiceAddress}`);
    console.log(`Marketplace: ${marketplaceAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Deployment file: ${filename}`);
    console.log("=".repeat(50));

    console.log("\n🎯 Next Steps:");
    console.log("1. Update your .env file with the new contract addresses:");
    console.log(`   NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS=${nameServiceAddress}`);
    console.log(`   NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
    console.log("2. Deploy to other supported networks for full omnichain functionality");
    console.log("3. Configure ZetaChain connector addresses if not already set");
    console.log("4. Test cross-chain functionality");

    console.log("\n✨ Deployment completed successfully!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });