const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing marketplace listing ownership...");

  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);

  // Test domains that might have ownership issues
  const testDomains = ["yupi", "human", "credit", "enliven"];

  for (const domainName of testDomains) {
    try {
      // Get current owner from blockchain
      const blockchainOwner = await ns.ownerOf(domainName);
      
      if (blockchainOwner === ethers.ZeroAddress) {
        console.log(`❌ Domain '${domainName}' not found on blockchain`);
        continue;
      }

      console.log(`\n🔍 Checking domain: ${domainName}`);
      console.log(`Blockchain owner: ${blockchainOwner}`);

      // Here you would check Supabase and update if needed
      // For now, just log the current blockchain state
      
    } catch (error) {
      console.error(`Error checking ${domainName}:`, error.message);
    }
  }

  console.log(`\n✅ Ownership check complete`);
  console.log(`\n💡 To fix any mismatches:`);
  console.log(`1. Transfer the domain to sync ownership`);
  console.log(`2. Or manually update the database`);
}

main().catch(console.error);