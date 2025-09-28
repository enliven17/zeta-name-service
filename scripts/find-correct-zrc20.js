const { ethers } = require('hardhat');

async function findCorrectZRC20() {
  console.log('🔍 Finding Correct ZRC20 Addresses...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Known ZRC20 addresses to test
  const zrc20Addresses = [
    "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // Previous attempt
    "0x0000000000000000000000000000000000000000", // Zero address (should fail)
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Gateway address
    "0x735b14BB79463307AAcBED86DAf3322B1e6226aB", // Protocol address
    "0x7CCE3Eb018bf23e1FE2a32692f2C77592D110394", // Registry address
  ];

  // ZRC20 ABI
  const zrc20ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)"
  ];

  console.log('🧪 Testing ZRC20 addresses...\n');

  for (let i = 0; i < zrc20Addresses.length; i++) {
    const address = zrc20Addresses[i];
    console.log(`Testing address ${i + 1}/${zrc20Addresses.length}: ${address}`);
    
    try {
      const contract = new ethers.Contract(address, zrc20ABI, deployer);
      
      // Try to read basic info
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      const balance = await contract.balanceOf(deployer.address);
      
      console.log(`✅ Valid ZRC20 Token Found!`);
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Balance: ${ethers.formatUnits(balance, decimals)}`);
      console.log(`   Address: ${address}\n`);
      
    } catch (error) {
      console.log(`❌ Not a valid ZRC20 token: ${error.message.split('\n')[0]}\n`);
    }
  }

  // Try to find ZRC20 tokens by checking common patterns
  console.log('🔍 Searching for ZRC20 tokens by pattern...\n');
  
  // Common ZRC20 patterns
  const patterns = [
    "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // Original
    "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // Same as original
    "0x0000000000000000000000000000000000000000", // Zero
  ];

  // Try to find ZRC20 by checking if it's a contract
  console.log('🔍 Checking if addresses are contracts...\n');
  
  for (const address of zrc20Addresses) {
    try {
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log(`❌ ${address} - Not a contract (EOA)`);
      } else {
        console.log(`✅ ${address} - Is a contract (${code.length} bytes)`);
      }
    } catch (error) {
      console.log(`❌ ${address} - Error checking: ${error.message}`);
    }
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Check ZetaChain documentation for correct ZRC20 addresses');
  console.log('2. Use ZetaChain bridge to get ZRC20 tokens');
  console.log('3. Or try using the Gateway without ZRC20 tokens');
}

findCorrectZRC20()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

