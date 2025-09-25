const { ethers } = require("hardhat");

async function main() {
  console.log("Debugging marketplace contract issue...");

  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
  
  if (!nsAddress || !mktAddress) {
    console.error("Contract addresses not found in environment");
    return;
  }

  console.log("ZetaNameService:", nsAddress);
  console.log("ZetaNameMarketplace:", mktAddress);

  // Get contract instances
  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);
  const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);

  // Check current marketplace setting in NameService
  const currentMarketplace = await ns.marketplace();
  console.log("Current marketplace in NameService:", currentMarketplace);
  console.log("Expected marketplace address:", mktAddress);
  console.log("Marketplace addresses match:", currentMarketplace.toLowerCase() === mktAddress.toLowerCase());

  // Check listing fee
  const listingFee = await mkt.LISTING_FEE();
  console.log("Listing fee:", ethers.formatEther(listingFee), "ETH");

  // If marketplace is not set correctly, fix it
  if (currentMarketplace.toLowerCase() !== mktAddress.toLowerCase()) {
    console.log("Marketplace address mismatch! Attempting to fix...");
    try {
      const tx = await ns.setMarketplace(mktAddress);
      await tx.wait();
      console.log("✅ Marketplace address updated successfully!");
    } catch (error) {
      console.error("❌ Failed to update marketplace address:", error.message);
    }
  } else {
    console.log("✅ Marketplace address is correctly set");
  }

  // Test domain ownership for debugging
  const testDomain = "test"; // Replace with actual domain name if needed
  try {
    const owner = await ns.ownerOf(testDomain);
    console.log(`Owner of '${testDomain}':`, owner);
    
    const expiresAt = await ns.expiresAt(testDomain);
    const expirationDate = new Date(Number(expiresAt) * 1000);
    console.log(`'${testDomain}' expires at:`, expirationDate);
    console.log(`'${testDomain}' is expired:`, expirationDate < new Date());
  } catch (error) {
    console.log(`Domain '${testDomain}' not found or error:`, error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });