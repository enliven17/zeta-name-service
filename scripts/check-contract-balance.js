const { ethers } = require("hardhat");

async function main() {
  const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
  const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
  
  console.log("📊 Checking contract balances...");
  console.log("Marketplace:", mktAddress);
  console.log("NameService:", nsAddress);

  // Get provider
  const provider = ethers.provider;

  // Check marketplace contract balance
  const mktBalance = await provider.getBalance(mktAddress);
  console.log(`\n💰 Marketplace Contract Balance: ${ethers.formatEther(mktBalance)} tCTC`);

  // Check name service contract balance  
  const nsBalance = await provider.getBalance(nsAddress);
  console.log(`💰 NameService Contract Balance: ${ethers.formatEther(nsBalance)} tCTC`);

  // Get contract instances to check owner
  const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);
  const ns = await ethers.getContractAt("ZetaNameService", nsAddress);

  const mktOwner = await mkt.owner();
  const nsOwner = await ns.owner();

  console.log(`\n👤 Marketplace Owner: ${mktOwner}`);
  console.log(`👤 NameService Owner: ${nsOwner}`);

  const deployerAddress = process.env.CONTRACT_OWNER_ADDRESS;
  console.log(`👤 Your Address: ${deployerAddress}`);

  console.log(`\n✅ You can withdraw from Marketplace: ${mktOwner.toLowerCase() === deployerAddress.toLowerCase()}`);
  console.log(`✅ You can withdraw from NameService: ${nsOwner.toLowerCase() === deployerAddress.toLowerCase()}`);

  // Calculate potential earnings
  const totalBalance = parseFloat(ethers.formatEther(mktBalance)) + parseFloat(ethers.formatEther(nsBalance));
  console.log(`\n💎 Total Withdrawable: ${totalBalance} tCTC`);
}

main().catch(console.error);