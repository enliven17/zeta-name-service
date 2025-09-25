const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing human.ctc listing ownership...");

  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);

  // Check current owner of human.ctc on blockchain
  const domainName = "human";
  const blockchainOwner = await ns.ownerOf(domainName);
  
  console.log(`\n📋 Domain: ${domainName}.ctc`);
  console.log(`Blockchain owner: ${blockchainOwner}`);
  
  if (blockchainOwner === ethers.ZeroAddress) {
    console.log("❌ Domain not found on blockchain");
    return;
  }

  // Check marketplace listing
  const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
  const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);
  
  try {
    const listing = await mkt.listings(domainName);
    console.log(`\n📝 Marketplace Listing:`);
    console.log(`Seller: ${listing.seller}`);
    console.log(`Price: ${ethers.formatEther(listing.price)} ETH`);
    console.log(`Active: ${listing.active}`);
    
    if (listing.active && listing.seller.toLowerCase() !== blockchainOwner.toLowerCase()) {
      console.log(`\n⚠️  MISMATCH DETECTED!`);
      console.log(`Blockchain owner: ${blockchainOwner}`);
      console.log(`Listing seller: ${listing.seller}`);
      console.log(`\n💡 The listing needs to be updated in Supabase database`);
      console.log(`\n🔧 Manual fix needed:`);
      console.log(`1. Update marketplace_listings table`);
      console.log(`2. Set seller_address = '${blockchainOwner.toLowerCase()}'`);
      console.log(`3. Where domain name = 'human'`);
    } else if (listing.active) {
      console.log(`\n✅ Listing ownership is correct`);
    } else {
      console.log(`\n📝 No active listing found`);
    }
    
  } catch (error) {
    console.error("Error checking marketplace listing:", error.message);
  }
}

main().catch(console.error);