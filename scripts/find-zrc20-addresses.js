const { ethers } = require('hardhat');

async function findZRC20Addresses() {
  console.log('🔍 Finding ZRC20 Token Addresses...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Account:', deployer.address);
  console.log(`Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Common ZRC20 addresses to try
  const possibleZRC20Addresses = [
    "0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD", // Common ETH ZRC20
    "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // Another common ZRC20
    "0x70e967acFcC17c3941E87562161406d41676FD83", // TSS address (might be ZRC20)
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Gateway address
  ];

  const zrc20ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function name() external view returns (string)",
    "function totalSupply() external view returns (uint256)"
  ];

  console.log('🔍 Testing possible ZRC20 addresses...\n');

  for (const address of possibleZRC20Addresses) {
    try {
      console.log(`Testing address: ${address}`);
      
      const contract = new ethers.Contract(address, zrc20ABI, deployer);
      
      // Try to get basic info
      const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
        contract.name().catch(() => "Unknown"),
        contract.symbol().catch(() => "Unknown"),
        contract.decimals().catch(() => 0),
        contract.totalSupply().catch(() => 0),
        contract.balanceOf(deployer.address).catch(() => 0)
      ]);

      console.log(`  ✅ Valid contract found!`);
      console.log(`  - Name: ${name}`);
      console.log(`  - Symbol: ${symbol}`);
      console.log(`  - Decimals: ${decimals}`);
      console.log(`  - Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
      console.log(`  - Your Balance: ${ethers.formatUnits(balance, decimals)}`);
      console.log(`  - Is ZRC20: ${symbol !== "Unknown" && decimals > 0 ? "Likely" : "Unknown"}`);
      console.log('');

    } catch (error) {
      console.log(`  ❌ Not a valid contract: ${error.message.split('\n')[0]}`);
    }
  }

  // Try to find ZRC20 through Gateway
  console.log('🔍 Checking Gateway for ZRC20 info...');
  try {
    const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
    const gatewayABI = [
      "function getZRC20Address(uint256 chainId) external view returns (address)",
      "function getZRC20Addresses() external view returns (address[])",
      "function getSupportedChains() external view returns (uint256[])"
    ];

    const gateway = new ethers.Contract(gatewayAddress, gatewayABI, deployer);
    
    try {
      const supportedChains = await gateway.getSupportedChains();
      console.log(`Supported chains: ${supportedChains.map(id => id.toString())}`);
      
      for (const chainId of supportedChains) {
        try {
          const zrc20Address = await gateway.getZRC20Address(chainId);
          console.log(`Chain ${chainId} ZRC20: ${zrc20Address}`);
        } catch (e) {
          console.log(`Chain ${chainId}: Could not get ZRC20 address`);
        }
      }
    } catch (error) {
      console.log('Could not get supported chains from Gateway');
    }

  } catch (error) {
    console.log('Could not access Gateway:', error.message);
  }

  console.log('\n💡 ZRC20 Token Information:');
  console.log('============================');
  console.log('1. ZRC20 tokens are needed for cross-chain gas fees');
  console.log('2. Each chain has its own ZRC20 representation');
  console.log('3. You need to bridge native tokens to get ZRC20');
  console.log('4. ZRC20 tokens are used to pay for cross-chain calls');

  console.log('\n🌉 How to get ZRC20 tokens:');
  console.log('============================');
  console.log('1. Go to ZetaChain bridge: https://athens.explorer.zetachain.com');
  console.log('2. Connect your wallet');
  console.log('3. Bridge ETH from this chain to ZetaChain');
  console.log('4. The bridged ETH becomes ZRC20 on ZetaChain');
  console.log('5. Use ZRC20 tokens for cross-chain calls');
}

findZRC20Addresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
