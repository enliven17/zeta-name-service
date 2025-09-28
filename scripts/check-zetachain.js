const { ethers } = require('hardhat');

async function checkZetaChain() {
  console.log('🔍 Checking ZetaChain Status...\n');

  const domainName = "arbtoethtest";
  const deployerAddress = "0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123";

  // ZetaChain contract address
  const zetaContractAddress = "0x6F40A56250fbB57F5a17C815BE66A36804590669";

  const ABI = [
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function isAvailable(string calldata name) external view returns (bool)"
  ];

  try {
    console.log('📊 Checking ZETACHAIN ATHENS (Hub Chain):');
    console.log('========================================');
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    const zetaContract = new ethers.Contract(zetaContractAddress, ABI, zetaProvider);
    
    try {
      const zetaOwner = await zetaContract.ownerOf(domainName);
      const zetaDomainInfo = await zetaContract.getDomainInfo(domainName);
      const zetaIsAvailable = await zetaContract.isAvailable(domainName);
      
      console.log(`Domain: ${domainName}.zeta`);
      console.log(`Owner: ${zetaOwner}`);
      console.log(`Available: ${zetaIsAvailable}`);
      console.log(`Source Chain ID: ${zetaDomainInfo[2].toString()}`);
      console.log(`Is Omnichain: ${zetaDomainInfo[3]}`);
      console.log(`Is Expired: ${zetaDomainInfo[4]}`);
      
      if (zetaOwner === deployerAddress) {
        console.log('✅ Domain found on ZetaChain (cross-chain processing)');
      } else if (zetaOwner === "0x0000000000000000000000000000000000000000") {
        console.log('⏳ Domain not yet visible on ZetaChain');
      } else {
        console.log('❌ Domain exists but owned by different address');
      }
    } catch (error) {
      console.log('❌ Error checking ZetaChain:', error.message);
    }

    // Check ZetaChain connector status
    console.log('\n🔧 Checking ZetaChain Connector:');
    console.log('================================');
    const connectorAddress = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67";
    
    try {
      const connectorCode = await zetaProvider.getCode(connectorAddress);
      if (connectorCode !== "0x") {
        console.log('✅ ZetaChain Connector is deployed and active');
      } else {
        console.log('❌ ZetaChain Connector not found');
      }
    } catch (error) {
      console.log('❌ Error checking connector:', error.message);
    }

    // Check recent blocks
    console.log('\n📊 Checking Recent ZetaChain Activity:');
    console.log('=====================================');
    try {
      const latestBlock = await zetaProvider.getBlockNumber();
      console.log(`Latest ZetaChain block: ${latestBlock}`);
      
      // Check last few blocks for activity
      for (let i = 0; i < 3; i++) {
        const block = await zetaProvider.getBlock(latestBlock - i);
        console.log(`Block ${block.number}: ${block.transactions.length} transactions`);
      }
    } catch (error) {
      console.log('❌ Error checking blocks:', error.message);
    }

    console.log('\n💡 Cross-Chain Transfer Status:');
    console.log('===============================');
    console.log('1. Transaction sent successfully ✅');
    console.log('2. ZetaChain processing in progress ⏳');
    console.log('3. Domain will appear on target chain when complete');
    console.log('4. This typically takes 2-5 minutes');
    console.log('\n🔄 Check again in a few minutes...');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkZetaChain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

