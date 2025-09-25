const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Syncing marketplace ownership with blockchain...");

  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
  
  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);
  const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);

  // Domains to check
  const domains = ["human", "yupi", "credit", "enliven"];
  const mismatches = [];

  for (const domainName of domains) {
    try {
      // Get blockchain owner
      const blockchainOwner = await ns.ownerOf(domainName);
      
      if (blockchainOwner === ethers.ZeroAddress) {
        console.log(`❌ ${domainName}: Not registered`);
        continue;
      }

      // Get marketplace listing
      const listing = await mkt.listings(domainName);
      
      if (!listing.active) {
        console.log(`📝 ${domainName}: No active listing`);
        continue;
      }

      console.log(`\n🔍 ${domainName}.ctc:`);
      console.log(`  Blockchain: ${blockchainOwner}`);
      console.log(`  Listing:    ${listing.seller}`);
      
      if (listing.seller.toLowerCase() !== blockchainOwner.toLowerCase()) {
        console.log(`  ⚠️  MISMATCH!`);
        mismatches.push({
          domain: domainName,
          blockchainOwner: blockchainOwner.toLowerCase(),
          listingSeller: listing.seller.toLowerCase(),
          price: ethers.formatEther(listing.price)
        });
      } else {
        console.log(`  ✅ Match`);
      }
      
    } catch (error) {
      console.error(`Error checking ${domainName}:`, error.message);
    }
  }

  if (mismatches.length > 0) {
    console.log(`\n🔧 Found ${mismatches.length} mismatches:`);
    mismatches.forEach(mismatch => {
    console.log(`\n📋 ${mismatch.domain}.zeta (${mismatch.price} ETH)`);
      console.log(`   FROM: ${mismatch.listingSeller}`);
      console.log(`   TO:   ${mismatch.blockchainOwner}`);
    });

    console.log(`\n💡 To fix these mismatches, you need to:`);
    console.log(`1. Update the Supabase marketplace_listings table`);
    console.log(`2. Or implement automatic sync in the transfer function`);
    console.log(`3. The transfer function should call updateListingOwnership()`);
  } else {
    console.log(`\n✅ All marketplace listings are in sync!`);
  }
}

main().catch(console.error);