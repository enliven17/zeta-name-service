const { ethers } = require('hardhat');

async function checkZRC20Balance() {
  console.log('🔍 Checking ZRC20 token balance...\n');

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
    
    // ZRC20 token address
    const zrc20Address = "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf";
    
    const ERC20_ABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
      "function balanceOf(address account) external view returns (uint256)",
      "function totalSupply() external view returns (uint256)"
    ];
    
    const zrc20Contract = new ethers.Contract(zrc20Address, ERC20_ABI, zetaProvider);
    
    console.log('📝 Checking ZRC20 token information...');
    
    const name = await zrc20Contract.name();
    const symbol = await zrc20Contract.symbol();
    const decimals = await zrc20Contract.decimals();
    const totalSupply = await zrc20Contract.totalSupply();
    const balance = await zrc20Contract.balanceOf(deployer.address);
    
    console.log(`Token Name: ${name}`);
    console.log(`Token Symbol: ${symbol}`);
    console.log(`Token Decimals: ${decimals}`);
    console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    console.log(`Your Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    
    if (balance > 0) {
      console.log('✅ You have ZRC20 tokens!');
      console.log('✅ Cross-chain transfers should work now');
    } else {
      console.log('❌ No ZRC20 tokens found');
      console.log('❌ Cross-chain transfers will fail');
      console.log('');
      console.log('To get ZRC20 tokens:');
      console.log('1. Go to ZetaChain Bridge: https://athens.explorer.zetachain.com/bridge');
      console.log('2. Connect your wallet');
      console.log('3. Bridge ETH from Arbitrum Sepolia to ZetaChain');
      console.log('4. Wait for bridge completion');
      console.log('5. Check balance again');
    }
    
    console.log('\n📋 ZRC20 Token Status:');
    console.log('======================');
    console.log('Your Address:', deployer.address);
    console.log('ZRC20 Contract:', zrc20Address);
    console.log('Balance:', ethers.formatUnits(balance, decimals), symbol);
    console.log('');
    
    if (balance > 0) {
      console.log('🎉 Ready for cross-chain transfers!');
    } else {
      console.log('⚠️  Need ZRC20 tokens for cross-chain transfers');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkZRC20Balance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
