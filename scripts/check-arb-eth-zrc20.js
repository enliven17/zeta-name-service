const { ethers } = require('hardhat');

async function checkArbEthZRC20() {
  console.log('🔍 Checking Arbitrum Sepolia ETH ZRC20 token...\n');

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
    
    // Arbitrum Sepolia ETH ZRC20 token address
    const arbEthZrc20Address = "0x1de70f3e971B62A0707dA18100392af14f7fB677";
    
    const ERC20_ABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
      "function balanceOf(address account) external view returns (uint256)",
      "function totalSupply() external view returns (uint256)"
    ];
    
    const arbEthZrc20Contract = new ethers.Contract(arbEthZrc20Address, ERC20_ABI, zetaProvider);
    
    console.log('📝 Checking Arbitrum Sepolia ETH ZRC20 token...');
    
    const name = await arbEthZrc20Contract.name();
    const symbol = await arbEthZrc20Contract.symbol();
    const decimals = await arbEthZrc20Contract.decimals();
    const totalSupply = await arbEthZrc20Contract.totalSupply();
    const balance = await arbEthZrc20Contract.balanceOf(deployer.address);
    
    console.log(`Token Name: ${name}`);
    console.log(`Token Symbol: ${symbol}`);
    console.log(`Token Decimals: ${decimals}`);
    console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    console.log(`Your Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    
    if (balance > 0) {
      console.log('✅ You have Arbitrum Sepolia ETH ZRC20 tokens!');
      console.log('✅ Cross-chain transfers should work now');
    } else {
      console.log('❌ No Arbitrum Sepolia ETH ZRC20 tokens found');
      console.log('❌ Cross-chain transfers will fail');
      console.log('');
      console.log('To get Arbitrum Sepolia ETH ZRC20 tokens:');
      console.log('1. Go to ZetaChain Bridge: https://athens.explorer.zetachain.com/bridge');
      console.log('2. Connect your wallet');
      console.log('3. Select Arbitrum Sepolia as source chain');
      console.log('4. Select ZetaChain as destination chain');
      console.log('5. Bridge ETH from Arbitrum Sepolia to ZetaChain');
      console.log('6. Wait for bridge completion');
      console.log('7. Check balance again');
    }
    
    console.log('\n📋 Arbitrum Sepolia ETH ZRC20 Token Status:');
    console.log('==========================================');
    console.log('Your Address:', deployer.address);
    console.log('ZRC20 Contract:', arbEthZrc20Address);
    console.log('Balance:', ethers.formatUnits(balance, decimals), symbol);
    console.log('');
    
    if (balance > 0) {
      console.log('🎉 Ready for cross-chain transfers!');
      console.log('🎉 You can now test cross-chain domain transfers');
    } else {
      console.log('⚠️  Need Arbitrum Sepolia ETH ZRC20 tokens for cross-chain transfers');
      console.log('⚠️  Use ZetaChain Bridge to get these tokens');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkArbEthZRC20()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
