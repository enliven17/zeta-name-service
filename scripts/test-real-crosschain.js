const { ethers } = require('hardhat');

// Test real cross-chain transfer functionality
async function testCrossChainTransfer() {
  console.log('🧪 Testing Real Cross-Chain Transfer...\n');

  // Contract addresses (NEW - Real Cross-Chain)
  const ETH_CONTRACT = '0x6783fB75e995Af777026141C68baee68a8C68c70'; // NEW ETH contract
  const ZETA_CONTRACT = '0x6DB7321011572AE285cc0371a46669A5f3799ADe'; // NEW ZETA contract

  const ABI = [
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable",
    "function register(string calldata name, bool makeOmnichain) external payable"
  ];

  try {
    // Test on Ethereum Sepolia
    console.log('🔍 Testing on Ethereum Sepolia...');
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const ethContract = new ethers.Contract(ETH_CONTRACT, ABI, ethProvider);

    // Check if deneme domain exists (our test domain)
    try {
      const owner = await ethContract.ownerOf('deneme');
      console.log('✅ Test domain owner:', owner);
      
      const domainInfo = await ethContract.getDomainInfo('deneme');
      console.log('📊 Domain info:', {
        owner: domainInfo[0],
        expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
        sourceChainId: domainInfo[2].toString(),
        isOmnichain: domainInfo[3],
        isExpired: domainInfo[4]
      });
      
      if (domainInfo[3]) {
        console.log('✅ Domain is omnichain-ready');
      } else {
        console.log('❌ Domain is not omnichain');
      }
      
    } catch (e) {
      console.log('❌ Test domain not found:', e.message);
      console.log('💡 You need to register "testcrosschain.zeta" as omnichain first');
    }

    console.log('\n🔍 Testing on ZetaChain...');
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    const zetaContract = new ethers.Contract(ZETA_CONTRACT, ABI, zetaProvider);

    try {
      const zetaOwner = await zetaContract.ownerOf('deneme');
      console.log('✅ ZetaChain domain owner:', zetaOwner);
    } catch (e) {
      console.log('❌ Domain not found on ZetaChain (expected if not transferred yet)');
    }

    console.log('\n🎯 Cross-Chain Transfer Test Instructions:');
    console.log('==========================================');
    console.log('1. Register "testcrosschain.zeta" as omnichain on Ethereum Sepolia');
    console.log('2. Use the UI to transfer it to ZetaChain');
    console.log('3. Check if it appears on ZetaChain after 2-5 minutes');
    console.log('4. If successful, the real cross-chain transfer is working!');

  } catch (error) {
    console.error('💥 Test Error:', error);
  }
}

testCrossChainTransfer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });