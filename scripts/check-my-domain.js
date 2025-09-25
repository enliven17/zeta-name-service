const { ethers } = require("hardhat");

async function main() {
  // Replace with the actual domain name you're trying to list
  const domainName = "yupi"; // Change this to your domain name (without .ctc)
  const userAddress = "0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123"; // Your wallet address

  console.log(`🔍 Checking domain: ${domainName}.ctc`);
  console.log(`👤 User address: ${userAddress}`);

  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);

  try {
    // Check ownership
    const owner = await ns.ownerOf(domainName);
    console.log(`\n📋 Owner: ${owner}`);
    
    if (owner === ethers.ZeroAddress) {
      console.log("❌ Domain is not registered or has expired");
      return;
    }
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.log("❌ You don't own this domain");
      console.log(`   Current owner: ${owner}`);
      return;
    }
    
    // Check expiration
    const expiresAt = await ns.expiresAt(domainName);
    const expirationDate = new Date(Number(expiresAt) * 1000);
    console.log(`⏰ Expires: ${expirationDate}`);
    
    if (expirationDate < new Date()) {
      console.log("❌ Domain has expired");
      return;
    }
    
    console.log("✅ Domain can be listed!");
    
  } catch (error) {
    console.error("Error checking domain:", error.message);
  }
}

main().catch(console.error);