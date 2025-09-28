const { ethers } = require('hardhat');

async function checkCorrectZRC20Addresses() {
  console.log('🔍 Checking correct ZRC20 token addresses from ZetaChain docs...\n');

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
    
    // Correct ZRC20 token addresses from ZetaChain docs
    const zrc20Addresses = {
      'arbitrum-sepolia-eth': {
        address: '0x1de70f3e971B62A0707dA18100392af14f7fB677',
        symbol: 'ETH.ARBSEP',
        description: 'ZetaChain ZRC20 ETH on Arbitrum Sepolia'
      },
      'ethereum-sepolia-eth': {
        address: '0x0ca762FA958194795320635c11fF0C45C6412958',
        symbol: 'ETH.ETHSEP',
        description: 'ZetaChain ZRC20 ETH on Ethereum Sepolia'
      }
    };
    
    const ERC20_ABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
      "function balanceOf(address account) external view returns (uint256)",
      "function totalSupply() external view returns (uint256)"
    ];
    
    console.log('📝 Checking ZRC20 token addresses from ZetaChain docs...\n');
    
    for (const [key, token] of Object.entries(zrc20Addresses)) {
      try {
        console.log(`🔍 ${token.description}:`);
        console.log(`   Address: ${token.address}`);
        
        const contract = new ethers.Contract(token.address, ERC20_ABI, zetaProvider);
        
        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const totalSupply = await contract.totalSupply();
        const balance = await contract.balanceOf(deployer.address);
        
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Decimals: ${decimals}`);
        console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
        console.log(`   Your Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
        
        if (balance > 0) {
          console.log(`   ✅ You have ${symbol} tokens!`);
        } else {
          console.log(`   ❌ No ${symbol} tokens found`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log('');
      }
    }
    
    console.log('📋 ZRC20 Token Summary:');
    console.log('======================');
    console.log('From ZetaChain official documentation:');
    console.log('');
    console.log('Arbitrum Sepolia ETH ZRC20:');
    console.log('  Address: 0x1de70f3e971B62A0707dA18100392af14f7fB677');
    console.log('  Symbol: ETH.ARBSEP');
    console.log('');
    console.log('Ethereum Sepolia ETH ZRC20:');
    console.log('  Address: 0x0ca762FA958194795320635c11fF0C45C6412958');
    console.log('  Symbol: ETH.ETHSEP');
    console.log('');
    console.log('To get ZRC20 tokens:');
    console.log('1. Use ZetaChain Bridge: https://athens.explorer.zetachain.com/bridge');
    console.log('2. Or use other bridges: Symbiosis, Rhino.fi, Layerswap');
    console.log('3. Bridge ETH from Arbitrum Sepolia to ZetaChain');
    console.log('4. Bridge ETH from Ethereum Sepolia to ZetaChain');
    console.log('5. Wait for bridge completion');
    console.log('6. Check balance again');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkCorrectZRC20Addresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
