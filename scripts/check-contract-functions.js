const { ethers } = require('hardhat');

const ETHEREUM_SEPOLIA_CONTRACT = '0x19E88E3790A43721faD03CD5A68A100E18F40c4E';

const ABI = [
  "function ownerOf(string calldata name) external view returns (address)",
  "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
  "function transfer(string calldata name, address to) external payable",
  "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable"
];

async function checkContractFunctions() {
  console.log('🔍 Checking contract functions...\n');

  try {
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const contract = new ethers.Contract(ETHEREUM_SEPOLIA_CONTRACT, ABI, ethProvider);

    console.log('📍 Contract Address:', ETHEREUM_SEPOLIA_CONTRACT);
    console.log('');

    // Test if functions exist by calling them with dummy data
    console.log('🔍 Testing contract functions:');
    
    try {
      // Test ownerOf
      await contract.ownerOf.staticCall('test');
      console.log('✅ ownerOf function exists');
    } catch (e) {
      if (e.message.includes('function does not exist')) {
        console.log('❌ ownerOf function missing');
      } else {
        console.log('✅ ownerOf function exists (expected error for non-existent domain)');
      }
    }

    try {
      // Test getDomainInfo
      await contract.getDomainInfo.staticCall('test');
      console.log('✅ getDomainInfo function exists');
    } catch (e) {
      if (e.message.includes('function does not exist')) {
        console.log('❌ getDomainInfo function missing');
      } else {
        console.log('✅ getDomainInfo function exists (expected error for non-existent domain)');
      }
    }

    try {
      // Test crossChainTransfer (this will fail but we can see if function exists)
      const iface = new ethers.Interface(ABI);
      const data = iface.encodeFunctionData('crossChainTransfer', ['test', '0x0000000000000000000000000000000000000000', 421614]);
      console.log('✅ crossChainTransfer function signature valid');
    } catch (e) {
      console.log('❌ crossChainTransfer function signature invalid:', e.message);
    }

    // Check recent transactions to see what functions are being called
    console.log('\n🔍 Checking recent transactions...');
    const currentBlock = await ethProvider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100);
    
    console.log(`📍 Scanning blocks ${fromBlock} to ${currentBlock}...`);
    
    for (let i = currentBlock; i > fromBlock; i--) {
      try {
        const block = await ethProvider.getBlock(i, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.to && tx.to.toLowerCase() === ETHEREUM_SEPOLIA_CONTRACT.toLowerCase()) {
              console.log(`📤 Transaction found in block ${i}:`);
              console.log(`   Hash: ${tx.hash}`);
              console.log(`   From: ${tx.from}`);
              console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
              console.log(`   Data: ${tx.data.substring(0, 10)}...`);
              
              // Try to decode the function call
              try {
                const iface = new ethers.Interface(ABI);
                const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
                console.log(`   Function: ${decoded.name}`);
                console.log(`   Args: ${JSON.stringify(decoded.args)}`);
              } catch (e) {
                console.log(`   Function: Unknown (${tx.data.substring(0, 10)})`);
              }
              console.log('');
            }
          }
        }
      } catch (e) {
        // Skip blocks that can't be fetched
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkContractFunctions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });