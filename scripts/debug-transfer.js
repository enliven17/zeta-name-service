const { ethers } = require('hardhat');

// Contract addresses and ABIs
const ETHEREUM_SEPOLIA_CONTRACT = '0x19E88E3790A43721faD03CD5A68A100E18F40c4E';
const ARBITRUM_SEPOLIA_CONTRACT = '0xAaFE053F1D8402282c839aeb595218F30aa7DCC6';
const ZETACHAIN_CONTRACT = '0x6F40A56250fbB57F5a17C815BE66A36804590669';

const ABI = [
  "function ownerOf(string calldata name) external view returns (address)",
  "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
  "function isAvailable(string calldata name) external view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event CrossChainTransfer(string indexed name, address indexed from, address indexed to, uint256 targetChainId)"
];

async function debugTransfer() {
  console.log('🔍 Debugging yummy.zeta cross-chain transfer...\n');

  try {
    // Providers
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const arbProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');

    // Contracts
    const ethContract = new ethers.Contract(ETHEREUM_SEPOLIA_CONTRACT, ABI, ethProvider);
    const arbContract = new ethers.Contract(ARBITRUM_SEPOLIA_CONTRACT, ABI, arbProvider);
    const zetaContract = new ethers.Contract(ZETACHAIN_CONTRACT, ABI, zetaProvider);

    console.log('📊 Current Status Check:');
    console.log('========================\n');

    // Check ETH status
    console.log('🔍 Ethereum Sepolia Status:');
    try {
      const ethOwner = await ethContract.ownerOf('yummy');
      const ethAvailable = await ethContract.isAvailable('yummy');
      console.log('  Owner:', ethOwner);
      console.log('  Available:', ethAvailable);
      console.log('  Status:', ethOwner === '0x0000000000000000000000000000000000000000' ? '❌ Burned/Transferred' : '✅ Still exists');
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }

    console.log('');

    // Check ARB status
    console.log('🔍 Arbitrum Sepolia Status:');
    try {
      const arbOwner = await arbContract.ownerOf('yummy');
      const arbAvailable = await arbContract.isAvailable('yummy');
      console.log('  Owner:', arbOwner);
      console.log('  Available:', arbAvailable);
      console.log('  Status:', arbOwner !== '0x0000000000000000000000000000000000000000' ? '✅ Successfully minted' : '❌ Not yet minted');
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }

    console.log('');

    // Check ZetaChain status
    console.log('🔍 ZetaChain Status:');
    try {
      const zetaOwner = await zetaContract.ownerOf('yummy');
      const zetaAvailable = await zetaContract.isAvailable('yummy');
      console.log('  Owner:', zetaOwner);
      console.log('  Available:', zetaAvailable);
    } catch (e) {
      console.log('  ❌ Error:', e.message);
    }

    console.log('');
    console.log('🔍 Recent Transfer Events (last 1000 blocks):');
    console.log('===============================================\n');

    // Check recent transfer events on ETH
    try {
      const currentBlock = await ethProvider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      console.log(`📍 Ethereum Sepolia Events (blocks ${fromBlock} to ${currentBlock}):`);
      
      const transferFilter = ethContract.filters.Transfer();
      const crossChainFilter = ethContract.filters.CrossChainTransfer();
      
      const transferEvents = await ethContract.queryFilter(transferFilter, fromBlock);
      const crossChainEvents = await ethContract.queryFilter(crossChainFilter, fromBlock);
      
      console.log(`  Found ${transferEvents.length} Transfer events`);
      console.log(`  Found ${crossChainEvents.length} CrossChainTransfer events`);
      
      // Look for yummy domain events
      const yummyTransfers = transferEvents.filter(event => {
        // Check if this could be yummy domain (we'd need to decode tokenId)
        return true; // For now, show all recent transfers
      });
      
      if (yummyTransfers.length > 0) {
        console.log('  Recent Transfer Events:');
        yummyTransfers.slice(-5).forEach((event, i) => {
          console.log(`    ${i+1}. Block: ${event.blockNumber}, From: ${event.args.from}, To: ${event.args.to}, TokenId: ${event.args.tokenId}`);
        });
      }
      
      if (crossChainEvents.length > 0) {
        console.log('  Recent CrossChain Events:');
        crossChainEvents.slice(-5).forEach((event, i) => {
          console.log(`    ${i+1}. Block: ${event.blockNumber}, Name: ${event.args.name}, From: ${event.args.from}, To: ${event.args.to}, TargetChain: ${event.args.targetChainId}`);
        });
      }
      
    } catch (e) {
      console.log('  ❌ Event query error:', e.message);
    }

    console.log('');
    console.log('🎯 Diagnosis:');
    console.log('=============');
    console.log('1. If ETH still shows owner: Transfer not initiated properly');
    console.log('2. If ETH shows zero address but ARB shows zero: Stuck in ZetaChain');
    console.log('3. If ARB shows correct owner: Transfer successful');
    console.log('4. Check transaction hash in ETH explorer for failure reason');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('- Check the original transaction hash in Ethereum Sepolia explorer');
    console.log('- Look for "failed" status or error messages');
    console.log('- If transaction succeeded but domain stuck, may need manual intervention');

  } catch (error) {
    console.error('💥 Debug Error:', error);
  }
}

debugTransfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });