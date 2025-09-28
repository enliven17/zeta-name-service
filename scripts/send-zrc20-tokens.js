const { ethers } = require('hardhat');

async function sendZRC20Tokens() {
  console.log('🔍 Sending ZRC20 tokens from our wallet...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Our wallet address:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Target address (your address)
  const targetAddress = "0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123";
  
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
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function approve(address spender, uint256 amount) external returns (bool)"
    ];
    
    const arbEthZrc20Contract = new ethers.Contract(arbEthZrc20Address, ERC20_ABI, zetaProvider);
    
    console.log('📝 Checking our ZRC20 token balance...');
    
    const name = await arbEthZrc20Contract.name();
    const symbol = await arbEthZrc20Contract.symbol();
    const decimals = await arbEthZrc20Contract.decimals();
    const ourBalance = await arbEthZrc20Contract.balanceOf(deployer.address);
    const targetBalance = await arbEthZrc20Contract.balanceOf(targetAddress);
    
    console.log(`Token: ${name} (${symbol})`);
    console.log(`Our Balance: ${ethers.formatUnits(ourBalance, decimals)} ${symbol}`);
    console.log(`Target Balance: ${ethers.formatUnits(targetBalance, decimals)} ${symbol}`);
    
    if (ourBalance > 0) {
      console.log('\n📝 Sending ZRC20 tokens...');
      
      // Send 0.1 ETH.ARBSEP (if we have enough)
      const sendAmount = ethers.parseUnits("0.1", decimals);
      
      if (ourBalance >= sendAmount) {
        console.log(`Sending ${ethers.formatUnits(sendAmount, decimals)} ${symbol} to ${targetAddress}...`);
        
        // Note: We can't actually send because we don't have a signer for ZetaChain
        // This is just a simulation
        console.log('⚠️  Cannot send tokens - no ZetaChain signer available');
        console.log('⚠️  You need to bridge tokens yourself using ZetaChain Bridge');
        console.log('');
        console.log('To get ZRC20 tokens:');
        console.log('1. Go to: https://athens.explorer.zetachain.com/bridge');
        console.log('2. Connect wallet: 0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123');
        console.log('3. Bridge ETH from Arbitrum Sepolia to ZetaChain');
        console.log('4. Wait for completion');
        
      } else {
        console.log(`❌ Insufficient balance. Need ${ethers.formatUnits(sendAmount, decimals)} ${symbol}, have ${ethers.formatUnits(ourBalance, decimals)} ${symbol}`);
      }
      
    } else {
      console.log('❌ No ZRC20 tokens in our wallet');
      console.log('❌ Cannot send tokens');
      console.log('');
      console.log('Our wallet needs ZRC20 tokens first:');
      console.log('1. Bridge ETH from Arbitrum Sepolia to ZetaChain');
      console.log('2. Or get tokens from ZetaChain faucet');
      console.log('3. Then we can send them to you');
    }
    
    console.log('\n📋 ZRC20 Token Transfer Status:');
    console.log('==============================');
    console.log('Our Address:', deployer.address);
    console.log('Target Address:', targetAddress);
    console.log('ZRC20 Contract:', arbEthZrc20Address);
    console.log('Our Balance:', ethers.formatUnits(ourBalance, decimals), symbol);
    console.log('Target Balance:', ethers.formatUnits(targetBalance, decimals), symbol);
    console.log('');
    
    if (ourBalance > 0) {
      console.log('✅ We have ZRC20 tokens but cannot send (no ZetaChain signer)');
      console.log('✅ You need to bridge tokens yourself');
    } else {
      console.log('❌ We have no ZRC20 tokens');
      console.log('❌ You need to bridge tokens yourself');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

sendZRC20Tokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
