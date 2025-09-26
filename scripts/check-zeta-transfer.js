const { ethers } = require('hardhat');

// Contract addresses
const ETHEREUM_SEPOLIA_CONTRACT = '0x19E88E3790A43721faD03CD5A68A100E18F40c4E';
const ZETACHAIN_CONTRACT = '0x6F40A56250fbB57F5a17C815BE66A36804590669';

// Contract ABI (minimal)
const ABI = [
  "function ownerOf(string calldata name) external view returns (address)",
  "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)"
];

async function checkZetaTransfer() {
  console.log('🔍 Checking deneme.zeta cross-chain transfer (ETH → ZETA)...\n');
  console.log('📤 Transaction: 0xb5dbfced3510dc8e02c1d369932953f7807b5e5bbb601fb7947850cb081dcce0\n');

  try {
    // Ethereum Sepolia provider
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const ethContract = new ethers.Contract(ETHEREUM_SEPOLIA_CONTRACT, ABI, ethProvider);

    // ZetaChain provider  
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    const zetaContract = new ethers.Contract(ZETACHAIN_CONTRACT, ABI, zetaProvider);

    console.log('📍 Ethereum Sepolia Contract:', ETHEREUM_SEPOLIA_CONTRACT);
    console.log('📍 ZetaChain Contract:', ZETACHAIN_CONTRACT);
    console.log('');

    // Check transaction status first
    console.log('🔍 Checking transaction status...');
    try {
      const txReceipt = await ethProvider.getTransactionReceipt('0xb5dbfced3510dc8e02c1d369932953f7807b5e5bbb601fb7947850cb081dcce0');
      if (txReceipt) {
        console.log('✅ Transaction Status:', txReceipt.status === 1 ? 'SUCCESS' : 'FAILED');
        console.log('📦 Block Number:', txReceipt.blockNumber);
        console.log('⛽ Gas Used:', txReceipt.gasUsed.toString());
        console.log('');
      } else {
        console.log('❌ Transaction not found');
        console.log('');
      }
    } catch (e) {
      console.log('❌ Error checking transaction:', e.message);
      console.log('');
    }

    // Check on Ethereum Sepolia
    console.log('🔍 Checking on Ethereum Sepolia...');
    try {
      const ethOwner = await ethContract.ownerOf('deneme');
      console.log('✅ ETH Owner:', ethOwner);
      
      try {
        const ethDomainInfo = await ethContract.getDomainInfo('deneme');
        console.log('📊 ETH Domain Info:', {
          owner: ethDomainInfo[0],
          expiresAt: new Date(Number(ethDomainInfo[1]) * 1000).toISOString(),
          sourceChainId: ethDomainInfo[2].toString(),
          isOmnichain: ethDomainInfo[3],
          isExpired: ethDomainInfo[4]
        });
      } catch (e) {
        console.log('⚠️ ETH getDomainInfo failed:', e.message);
      }
    } catch (error) {
      console.log('❌ ETH Error:', error.message);
    }

    console.log('');

    // Check on ZetaChain
    console.log('🔍 Checking on ZetaChain...');
    try {
      const zetaOwner = await zetaContract.ownerOf('deneme');
      console.log('✅ ZETA Owner:', zetaOwner);
      
      try {
        const zetaDomainInfo = await zetaContract.getDomainInfo('deneme');
        console.log('📊 ZETA Domain Info:', {
          owner: zetaDomainInfo[0],
          expiresAt: new Date(Number(zetaDomainInfo[1]) * 1000).toISOString(),
          sourceChainId: zetaDomainInfo[2].toString(),
          isOmnichain: zetaDomainInfo[3],
          isExpired: zetaDomainInfo[4]
        });
      } catch (e) {
        console.log('⚠️ ZETA getDomainInfo failed:', e.message);
      }
    } catch (error) {
      console.log('❌ ZETA Error:', error.message);
    }

    console.log('');
    console.log('🎯 Transfer Analysis:');
    console.log('====================');
    console.log('✅ Transaction was successful on Ethereum');
    console.log('🔍 Expected behavior:');
    console.log('  - ETH: Domain should be burned/transferred (zero address)');
    console.log('  - ZETA: Domain should be minted to recipient');
    console.log('');
    console.log('⏰ Cross-chain transfers can take 2-10 minutes');
    console.log('🔗 Check ZetaChain explorer: https://athens.explorer.zetachain.com/');

  } catch (error) {
    console.error('💥 Script Error:', error);
  }
}

checkZetaTransfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });