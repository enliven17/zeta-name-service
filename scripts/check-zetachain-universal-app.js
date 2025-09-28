const { ethers } = require('hardhat');

async function checkZetaChainUniversalApp() {
  console.log('🔍 Checking ZetaChain Universal App status...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ZetaChain Testnet contract addresses
  const zetaChainAddress = "0x6F40A56250fbB57F5a17C815BE66A36804590669";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  try {
    console.log('📝 Checking ZetaChain Universal App...');
    
    // Check if we can connect to ZetaChain
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    const zetaContract = new ethers.Contract(zetaChainAddress, ABI, zetaProvider);
    
    console.log('✅ Connected to ZetaChain');
    
    // Check recent blocks
    const latestBlock = await zetaProvider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);
    
    // Check if contract is responding
    const supportedChains = await zetaContract.getSupportedChains();
    console.log(`Supported chains: ${supportedChains.map(c => c.toString()).join(', ')}`);
    
    // Check if there are any recent transactions
    console.log('\n📝 Checking recent blocks for cross-chain activity...');
    
    for (let i = 0; i < 5; i++) {
      try {
        const blockNumber = latestBlock - i;
        const block = await zetaProvider.getBlock(blockNumber, true);
        
        console.log(`\nBlock ${blockNumber}:`);
        console.log(`  Timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
        console.log(`  Transactions: ${block.transactions.length}`);
        
        // Check for transactions to our contract
        const contractTransactions = block.transactions.filter(tx => 
          tx.to && tx.to.toLowerCase() === zetaChainAddress.toLowerCase()
        );
        
        if (contractTransactions.length > 0) {
          console.log(`  Contract transactions: ${contractTransactions.length}`);
          for (const tx of contractTransactions) {
            console.log(`    ${tx.hash} (from: ${tx.from})`);
          }
        }
        
      } catch (error) {
        console.log(`  Error checking block ${latestBlock - i}: ${error.message}`);
      }
    }
    
    console.log('\n📋 ZetaChain Universal App Analysis:');
    console.log('====================================');
    console.log('1. If no recent transactions, ZetaChain may not be processing cross-chain messages');
    console.log('2. If contract is not responding, Universal App may not be deployed');
    console.log('3. Cross-chain transfers require ZRC20 gas tokens on ZetaChain');
    console.log('4. Gateway may not be forwarding messages to Universal App');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkZetaChainUniversalApp()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
