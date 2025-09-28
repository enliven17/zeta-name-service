const { ethers } = require('hardhat');

async function findZRC20Addresses() {
  console.log('🔍 Finding ZRC20 token addresses on ZetaChain...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  try {
    // Connect to ZetaChain
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
    console.log('✅ Connected to ZetaChain');
    
    // Common ZRC20 addresses for different chains
    const zrc20Addresses = {
      // Arbitrum Sepolia ZRC20
      'arbitrum-sepolia': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
      // Ethereum Sepolia ZRC20  
      'ethereum-sepolia': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
      // BSC Testnet ZRC20
      'bsc-testnet': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf',
      // Polygon Mumbai ZRC20
      'polygon-mumbai': '0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf'
    };
    
    const ERC20_ABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
      "function totalSupply() external view returns (uint256)",
      "function balanceOf(address account) external view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];
    
    console.log('📝 Checking ZRC20 token addresses...\n');
    
    for (const [chainName, address] of Object.entries(zrc20Addresses)) {
      try {
        console.log(`🔍 ${chainName.toUpperCase()} ZRC20 (${address}):`);
        
        const contract = new ethers.Contract(address, ERC20_ABI, zetaProvider);
        
        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const totalSupply = await contract.totalSupply();
        
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Decimals: ${decimals}`);
        console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
        
        // Check if this is a valid ERC20 token
        if (name && symbol && decimals >= 0) {
          console.log(`   ✅ Valid ZRC20 token`);
        } else {
          console.log(`   ❌ Invalid token`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log('');
      }
    }
    
    console.log('📋 ZRC20 Token Information:');
    console.log('===========================');
    console.log('For cross-chain transfers, you need ZRC20 tokens on ZetaChain.');
    console.log('ZRC20 tokens represent native gas assets from connected chains.');
    console.log('');
    console.log('To get ZRC20 tokens:');
    console.log('1. Bridge native tokens (ETH, BNB, MATIC) to ZetaChain');
    console.log('2. Use ZetaChain bridge: https://athens.explorer.zetachain.com/bridge');
    console.log('3. Or use the ZetaChain faucet if available');
    console.log('');
    console.log('Your address for receiving ZRC20 tokens:');
    console.log(`   ${deployer.address}`);
    console.log('');
    console.log('Recommended ZRC20 token to get:');
    console.log('   Arbitrum Sepolia ZRC20: 0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf');
    console.log('   (This represents ETH from Arbitrum Sepolia)');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

findZRC20Addresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });