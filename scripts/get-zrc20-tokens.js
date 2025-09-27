const { ethers } = require('hardhat');

async function getZRC20Tokens() {
  console.log('🪙 Getting ZRC20 Tokens for Cross-Chain Transfer...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ZetaChain Gateway address
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
  
  // ZRC20 token addresses for different chains
  const zrc20Addresses = {
    421614: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf", // Arbitrum Sepolia - zETH
    11155111: "0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf"  // Ethereum Sepolia - zETH
  };

  const zrc20Address = zrc20Addresses[currentChainId];
  
  if (!zrc20Address) {
    console.log('❌ No ZRC20 address found for chain ID:', currentChainId);
    return;
  }

  console.log('🔧 ZRC20 Configuration:');
  console.log('- ZRC20 Address:', zrc20Address);
  console.log('- Chain ID:', currentChainId);

  // ZRC20 ABI
  const zrc20ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)"
  ];

  try {
    const zrc20Contract = new ethers.Contract(zrc20Address, zrc20ABI, deployer);
    
    // Check ZRC20 token info
    console.log('\n📊 Checking ZRC20 Token Info...');
    try {
      const name = await zrc20Contract.name();
      const symbol = await zrc20Contract.symbol();
      const decimals = await zrc20Contract.decimals();
      const totalSupply = await zrc20Contract.totalSupply();
      
      console.log('Token Name:', name);
      console.log('Token Symbol:', symbol);
      console.log('Decimals:', decimals);
      console.log('Total Supply:', ethers.formatUnits(totalSupply, decimals));
    } catch (error) {
      console.log('❌ Could not read ZRC20 token info:', error.message);
    }

    // Check current balance
    console.log('\n💰 Checking Current ZRC20 Balance...');
    try {
      const balance = await zrc20Contract.balanceOf(deployer.address);
      console.log('Current ZRC20 Balance:', ethers.formatUnits(balance, 18));
      
      if (balance > 0) {
        console.log('✅ You already have ZRC20 tokens!');
        return;
      }
    } catch (error) {
      console.log('❌ Could not read ZRC20 balance:', error.message);
    }

    // Try to get ZRC20 tokens by bridging ETH
    console.log('\n🌉 Attempting to Bridge ETH to ZRC20...');
    
    // Gateway ABI for deposit
    const gatewayABI = [
      "function deposit(address receiver, uint256 amount, RevertOptions calldata revertOptions) external payable",
      "function deposit(address receiver, RevertOptions calldata revertOptions) external payable"
    ];

    const gateway = new ethers.Contract(gatewayAddress, gatewayABI, deployer);
    
    // Try simple deposit (without amount parameter)
    try {
      console.log('Trying simple deposit...');
      const depositAmount = ethers.parseEther("0.001"); // 0.001 ETH
      
      const revertOptions = {
        revertAddress: deployer.address,
        callOnRevert: false,
        abortAddress: deployer.address,
        revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["Deposit failed"]),
        onRevertGasLimit: 0
      };

      const tx = await gateway.deposit(
        deployer.address,
        revertOptions,
        {
          value: depositAmount,
          gasLimit: 200000
        }
      );
      
      console.log('Deposit transaction:', tx.hash);
      await tx.wait();
      console.log('✅ ETH deposited to ZetaChain!');
      
      // Wait a bit for ZRC20 tokens to be minted
      console.log('⏳ Waiting for ZRC20 tokens to be minted...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check balance again
      const newBalance = await zrc20Contract.balanceOf(deployer.address);
      console.log('New ZRC20 Balance:', ethers.formatUnits(newBalance, 18));
      
      if (newBalance > 0) {
        console.log('🎉 Successfully got ZRC20 tokens!');
      } else {
        console.log('⏳ ZRC20 tokens not yet available, may take longer to process');
      }
      
    } catch (error) {
      console.log('❌ Deposit failed:', error.message);
      
      // Try alternative deposit method
      try {
        console.log('Trying alternative deposit method...');
        const depositAmount = ethers.parseEther("0.001");
        
        const revertOptions = {
          revertAddress: deployer.address,
          callOnRevert: false,
          abortAddress: deployer.address,
          revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["Deposit failed"]),
          onRevertGasLimit: 0
        };

        const tx = await gateway.deposit(
          deployer.address,
          depositAmount,
          revertOptions,
          {
            value: depositAmount,
            gasLimit: 200000
          }
        );
        
        console.log('Alternative deposit transaction:', tx.hash);
        await tx.wait();
        console.log('✅ ETH deposited to ZetaChain (alternative method)!');
        
      } catch (error2) {
        console.log('❌ Alternative deposit also failed:', error2.message);
        console.log('💡 You may need to manually bridge ETH to ZetaChain to get ZRC20 tokens');
      }
    }

  } catch (error) {
    console.error('❌ ZRC20 token acquisition failed:', error.message);
  }
}

getZRC20Tokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });