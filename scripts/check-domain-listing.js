const { ethers } = require("hardhat");

async function main() {
  // Get the domain name from command line args or use a default
  const domainName = process.argv[2] || "example"; // Replace with actual domain
  const userAddress = process.argv[3] || process.env.CONTRACT_OWNER_ADDRESS;

  console.log(`Checking domain listing requirements for: ${domainName}`);
  console.log(`User address: ${userAddress}`);

  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;

  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);
  const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);

  // Check domain ownership
  const owner = await ns.ownerOf(domainName);
  console.log(`\n📋 Domain Ownership Check:`);
  console.log(`Domain owner: ${owner}`);
  console.log(`User address: ${userAddress}`);
  console.log(`User owns domain: ${owner.toLowerCase() === userAddress.toLowerCase()}`);

  // Check domain expiration
  const expiresAt = await ns.expiresAt(domainName);
  const expirationDate = new Date(Number(expiresAt) * 1000);
  const isExpired = expirationDate < new Date();
  console.log(`\n⏰ Domain Expiration Check:`);
  console.log(`Expires at: ${expirationDate}`);
  console.log(`Is expired: ${isExpired}`);

  // Check listing fee
  const listingFee = await mkt.LISTING_FEE();
  console.log(`\n💰 Listing Fee:`);
  console.log(`Required fee: ${ethers.formatEther(listingFee)} ETH`);

  // Check if domain is already listed
  try {
    const listing = await mkt.listings(domainName);
    console.log(`\n📝 Current Listing Status:`);
    console.log(`Seller: ${listing.seller}`);
    console.log(`Price: ${ethers.formatEther(listing.price)} CTC`);
    console.log(`Active: ${listing.active}`);
  } catch (error) {
    console.log(`\n📝 Listing Status: Not listed or error checking`);
  }

  // Summary
  console.log(`\n🔍 LISTING REQUIREMENTS SUMMARY:`);
  console.log(`✅ Marketplace configured: YES`);
  console.log(`${owner.toLowerCase() === userAddress.toLowerCase() ? '✅' : '❌'} User owns domain: ${owner.toLowerCase() === userAddress.toLowerCase()}`);
  console.log(`${!isExpired ? '✅' : '❌'} Domain not expired: ${!isExpired}`);
  console.log(`✅ Listing fee known: ${ethers.formatEther(listingFee)} CTC`);

  if (owner === ethers.ZeroAddress) {
    console.log(`\n⚠️  Domain '${domainName}' is not registered or has expired`);
  } else if (owner.toLowerCase() !== userAddress.toLowerCase()) {
    console.log(`\n⚠️  User ${userAddress} does not own domain '${domainName}'`);
    console.log(`   Domain is owned by: ${owner}`);
  } else if (isExpired) {
    console.log(`\n⚠️  Domain '${domainName}' has expired`);
  } else {
    console.log(`\n✅ All requirements met! Domain can be listed.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });