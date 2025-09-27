const { ethers } = require('hardhat');

// Contract addresses
const ETHEREUM_SEPOLIA_CONTRACT = '0x19E88E3790A43721faD03CD5A68A100E18F40c4E';
const ARBITRUM_SEPOLIA_CONTRACT = '0xAaFE053F1D8402282c839aeb595218F30aa7DCC6';

const ABI = [
  "function ownerOf(string calldata name) external view returns (address)",
  "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
  "function isAvailable(string calldata name) external view returns (bool)",
  "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable"
];

async function debugCrossDomain() {
  console.log('🔍 Debugging cross.zeta cross-chain transfer...\n');

  const domainName = 'cross';

  try {
    // Providers
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const arbProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');

    // Contracts
    const ethContract = new ethers.Contract(ETHEREUM_SEPOLIA_CONTRACT, ABI, ethProvider);
    const arbContract = new ethers.Contract(ARBITRUM_SEPOLIA_CONTRACT, ABI, arbProvider);

    console.log('📊 Current Status Check for cross.zeta:');
    console.log('=====================================\n');

    // Check ETH status
    console.log('🔍 Ethereum Sepolia Status:');
    try {
      const ethOwner = await ethContract.ownerOf(domainName);
      const ethInfo = await ethContract.getDomainInfo(domainName);
      const ethAvailable = await ethContract.isAvailable(domainName);

      console.log('  Owner:', ethOwner);
      console.log('  Available:', ethAvailable);
      console.log('  Domain Info:', {
        owner: ethInfo[0],
        expiresAt: new Date(Number(ethInfo[1]) * 1000).toISOString(),
        sourceChainId: Number(ethInfo[2]),
        isOmnichain: ethInfo[3],
        isExpired: ethInfo[4]
      });
      console.log('  Status:', ethOwner !== '0x0000000000000000000000000000000000000000' ? '✅ Domain exists' : '❌ Domain not found');
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }

    console.log('');

    // Check ARB status
    console.log('🔍 Arbitrum Sepolia Status:');
    try {
      const arbOwner = await arbContract.ownerOf(domainName);
      const arbInfo = await arbContract.getDomainInfo(domainName);
      const arbAvailable = await arbContract.isAvailable(domainName);

      console.log('  Owner:', arbOwner);
      console.log('  Available:', arbAvailable);
      console.log('  Domain Info:', {
        owner: arbInfo[0],
        expiresAt: new Date(Number(arbInfo[1]) * 1000).toISOString(),
        sourceChainId: Number(arbInfo[2]),
        isOmnichain: arbInfo[3],
        isExpired: arbInfo[4]
      });
      console.log('  Status:', arbOwner !== '0x0000000000000000000000000000000000000000' ? '✅ Domain exists' : '❌ Domain not found');
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }

    console.log('');
    console.log('🎯 Analysis:');
    console.log('============');

    const ethOwner = await ethContract.ownerOf(domainName).catch(() => '0x0000000000000000000000000000000000000000');
    const arbOwner = await arbContract.ownerOf(domainName).catch(() => '0x0000000000000000000000000000000000000000');

    if (ethOwner !== '0x0000000000000000000000000000000000000000' && arbOwner === '0x0000000000000000000000000000000000000000') {
      console.log('🔄 Domain exists on Ethereum but not on Arbitrum');
      console.log('💡 Cross-chain transfer might be stuck or failed');

      const ethInfo = await ethContract.getDomainInfo(domainName);
      console.log('📋 Domain is omnichain:', ethInfo[3]);
      console.log('📅 Expires:', new Date(Number(ethInfo[1]) * 1000).toISOString());
    } else if (ethOwner === '0x0000000000000000000000000000000000000000' && arbOwner !== '0x0000000000000000000000000000000000000000') {
      console.log('✅ Cross-chain transfer successful!');
      console.log('🎉 Domain successfully moved to Arbitrum Sepolia');
    } else if (ethOwner !== '0x0000000000000000000000000000000000000000' && arbOwner !== '0x0000000000000000000000000000000000000000') {
      console.log('⚠️  Domain exists on both chains - potential duplicate');
    } else {
      console.log('❌ Domain not found on either chain');
    }

    console.log('');
    console.log('🔧 Recommended Actions:');
    console.log('=======================');
    console.log('1. Check the failed transaction on Ethereum explorer');
    console.log('2. If domain is stuck, may need manual intervention');
    console.log('3. Verify ZetaChain connector configuration');
    console.log('4. Check gas limits and fees');

  } catch (error) {
    console.error('💥 Debug Error:', error);
  }
}

debugCrossDomain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });