const { ethers } = require("hardhat");

async function main() {
  const userAddress = "0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123"; // Your wallet address
  
  console.log(`🔍 Checking listings for user: ${userAddress}`);

  const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
  const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);
  
  // Check specific domain listing
  const domainName = "yupi"; // Replace with your domain
  
  try {
    const listing = await mkt.listings(domainName);
    console.log(`\n📝 Listing for '${domainName}':`);
    console.log(`Seller: ${listing.seller}`);
    console.log(`Price: ${ethers.formatEther(listing.price)} ETH`);
    console.log(`Active: ${listing.active}`);
    console.log(`Is your listing: ${listing.seller.toLowerCase() === userAddress.toLowerCase()}`);
  } catch (error) {
    console.error(`Error checking listing for '${domainName}':`, error.message);
  }
}

main().catch(console.error);