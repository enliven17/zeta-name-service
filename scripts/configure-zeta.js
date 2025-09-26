const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Configuring ZetaChain Integration...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log("Configuring with account:", deployer.address);
  console.log(`Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ZetaChain Athens Testnet addresses
  const zetaConfig = {
    connector: "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67",
    token: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", 
    tss: "0x70e967acFcC17c3941E87562161406d41676FD83"
  };

  console.log("ZetaChain configuration:");
  console.log("- Connector:", zetaConfig.connector);
  console.log("- Token:", zetaConfig.token);
  console.log("- TSS:", zetaConfig.tss);

  // Contract addresses
  const contractAddress = currentChainId === 421614 
    ? "0xAaFE053F1D8402282c839aeb595218F30aa7DCC6" 
    : "0x6F40A56250fbB57F5a17C815BE66A36804590669";

  const marketplaceAddress = currentChainId === 421614
    ? "0x897FBB05A18ceE2d9451a9F644B9831DDf4Dd481"
    : "0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6";

  console.log("\nContract addresses:");
  console.log("- Name Service:", contractAddress);
  console.log("- Marketplace:", marketplaceAddress);

  // ABI for configuration functions
  const nameServiceABI = [
    "function setZetaConfig(address _connector, address _token, address _tss) external",
    "function zetaConnector() external view returns (address)",
    "function zetaToken() external view returns (address)",
    "function tssAddress() external view returns (address)",
    "function owner() external view returns (address)"
  ];

  const marketplaceABI = [
    "function setZetaConfig(address _connector, address _token) external",
    "function zetaConnector() external view returns (address)",
    "function zetaToken() external view returns (address)",
    "function owner() external view returns (address)"
  ];

  try {
    // Configure Name Service
    console.log("\n🔧 Configuring Name Service...");
    const nameService = new ethers.Contract(contractAddress, nameServiceABI, deployer);
    
    // Check current owner
    const nameServiceOwner = await nameService.owner();
    console.log("Name Service owner:", nameServiceOwner);
    console.log("Deployer address:", deployer.address);
    
    if (nameServiceOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ Not the owner of Name Service contract");
      return;
    }

    // Check current configuration
    const currentConnector = await nameService.zetaConnector();
    const currentToken = await nameService.zetaToken();
    const currentTss = await nameService.tssAddress();
    
    console.log("Current configuration:");
    console.log("- Connector:", currentConnector);
    console.log("- Token:", currentToken);
    console.log("- TSS:", currentTss);

    if (currentConnector === ethers.ZeroAddress) {
      console.log("Setting ZetaChain configuration for Name Service...");
      const setZetaTx = await nameService.setZetaConfig(
        zetaConfig.connector,
        zetaConfig.token,
        zetaConfig.tss
      );
      
      console.log("Transaction hash:", setZetaTx.hash);
      await setZetaTx.wait();
      console.log("✅ Name Service ZetaChain configuration set!");
    } else {
      console.log("✅ Name Service already configured");
    }

    // Configure Marketplace
    console.log("\n🔧 Configuring Marketplace...");
    const marketplace = new ethers.Contract(marketplaceAddress, marketplaceABI, deployer);
    
    // Check current owner
    const marketplaceOwner = await marketplace.owner();
    console.log("Marketplace owner:", marketplaceOwner);
    
    if (marketplaceOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ Not the owner of Marketplace contract");
      return;
    }

    // Check current configuration
    const currentMarketplaceConnector = await marketplace.zetaConnector();
    const currentMarketplaceToken = await marketplace.zetaToken();
    
    console.log("Current marketplace configuration:");
    console.log("- Connector:", currentMarketplaceConnector);
    console.log("- Token:", currentMarketplaceToken);

    if (currentMarketplaceConnector === ethers.ZeroAddress) {
      console.log("Setting ZetaChain configuration for Marketplace...");
      const setMarketplaceZetaTx = await marketplace.setZetaConfig(
        zetaConfig.connector,
        zetaConfig.token
      );
      
      console.log("Transaction hash:", setMarketplaceZetaTx.hash);
      await setMarketplaceZetaTx.wait();
      console.log("✅ Marketplace ZetaChain configuration set!");
    } else {
      console.log("✅ Marketplace already configured");
    }

    // Verify configuration
    console.log("\n🔍 Verifying configuration...");
    const newConnector = await nameService.zetaConnector();
    const newToken = await nameService.zetaToken();
    const newTss = await nameService.tssAddress();
    
    console.log("Final Name Service configuration:");
    console.log("- Connector:", newConnector);
    console.log("- Token:", newToken);
    console.log("- TSS:", newTss);

    const newMarketplaceConnector = await marketplace.zetaConnector();
    const newMarketplaceToken = await marketplace.zetaToken();
    
    console.log("Final Marketplace configuration:");
    console.log("- Connector:", newMarketplaceConnector);
    console.log("- Token:", newMarketplaceToken);

    console.log("\n✨ ZetaChain configuration completed successfully!");
    console.log("\n🎯 Next steps:");
    console.log("1. Test cross-chain transfers again");
    console.log("2. Verify cross-chain functionality works");
    console.log("3. Test marketplace cross-chain offers");

  } catch (error) {
    console.error("❌ Configuration failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Configuration script failed:", error);
    process.exit(1);
  });