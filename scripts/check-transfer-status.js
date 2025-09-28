const { ethers } = require('hardhat');

async function checkTransferStatus() {
  console.log('🔍 Checking Cross-Chain Transfer Status...\n');

  const domainName = "arbtoethtest"; // Test ettiğimiz domain
  const deployerAddress = "0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123";

  // Contract addresses
  const arbContractAddress = "0xAaFE053F1D8402282c839aeb595218F30aa7DCC6";
  const ethContractAddress = "0x6783fB75e995Af777026141C68baee68a8C68c70";

  const ABI = [
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function isAvailable(string calldata name) external view returns (bool)"
  ];

  try {
    // Check on Arbitrum Sepolia (source chain)
    console.log('📊 Checking ARBITRUM SEPOLIA (Source Chain):');
    console.log('==========================================');
    const arbProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const arbContract = new ethers.Contract(arbContractAddress, ABI, arbProvider);
    
    try {
      const arbOwner = await arbContract.ownerOf(domainName);
      const arbDomainInfo = await arbContract.getDomainInfo(domainName);
      const arbIsAvailable = await arbContract.isAvailable(domainName);
      
      console.log(`Domain: ${domainName}.zeta`);
      console.log(`Owner: ${arbOwner}`);
      console.log(`Available: ${arbIsAvailable}`);
      console.log(`Source Chain ID: ${arbDomainInfo[2].toString()}`);
      console.log(`Is Omnichain: ${arbDomainInfo[3]}`);
      console.log(`Is Expired: ${arbDomainInfo[4]}`);
      
      if (arbOwner === "0x0000000000000000000000000000000000000000" || arbIsAvailable) {
        console.log('✅ Domain BURNED on Arbitrum Sepolia (transfer successful)');
      } else {
        console.log('❌ Domain still exists on Arbitrum Sepolia (transfer pending)');
      }
    } catch (error) {
      console.log('❌ Error checking Arbitrum Sepolia:', error.message);
    }

    console.log('\n📊 Checking ETHEREUM SEPOLIA (Target Chain):');
    console.log('==========================================');
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const ethContract = new ethers.Contract(ethContractAddress, ABI, ethProvider);
    
    try {
      const ethOwner = await ethContract.ownerOf(domainName);
      const ethDomainInfo = await ethContract.getDomainInfo(domainName);
      const ethIsAvailable = await ethContract.isAvailable(domainName);
      
      console.log(`Domain: ${domainName}.zeta`);
      console.log(`Owner: ${ethOwner}`);
      console.log(`Available: ${ethIsAvailable}`);
      console.log(`Source Chain ID: ${ethDomainInfo[2].toString()}`);
      console.log(`Is Omnichain: ${ethDomainInfo[3]}`);
      console.log(`Is Expired: ${ethDomainInfo[4]}`);
      
      if (ethOwner === deployerAddress) {
        console.log('✅ SUCCESS! Domain MINTED on Ethereum Sepolia');
        console.log('🎉 Cross-chain transfer completed successfully!');
      } else if (ethOwner === "0x0000000000000000000000000000000000000000") {
        console.log('⏳ Domain not yet visible on Ethereum Sepolia');
        console.log('💡 Transfer may still be processing (2-5 minutes)');
      } else {
        console.log('❌ Domain exists but owned by different address');
      }
    } catch (error) {
      console.log('❌ Error checking Ethereum Sepolia:', error.message);
    }

    // Check transaction status
    console.log('\n🔍 Checking Recent Transactions:');
    console.log('================================');
    console.log('Last cross-chain transfer transaction: 0x64546e2f96d43863636660a8de76eaf2c3c5c0f40320f0cc4080c7e40e894541');
    console.log('Check on Arbiscan: https://sepolia.arbiscan.io/tx/0x64546e2f96d43863636660a8de76eaf2c3c5c0f40320f0cc4080c7e40e894541');
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('1. Check if domain is burned on source chain (Arbitrum)');
    console.log('2. Check if domain is minted on target chain (Ethereum)');
    console.log('3. If both conditions are met, transfer is successful');
    console.log('4. If not, wait a few more minutes and check again');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkTransferStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

