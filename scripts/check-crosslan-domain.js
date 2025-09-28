const { ethers } = require('hardhat');

async function checkCrosslanDomain() {
  console.log('🔍 Checking crosslan.zeta domain status...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // FIXED Universal App contract addresses
  const arbFixedAddress = "0xb5980f90ab6c35e6D14a228553066C1D2D8C0cd7";
  const ethFixedAddress = "0x85c88B3F703df37E72cD68F292814cc5A571F73C";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  const domainName = "crosslan";
  
  try {
    console.log('📝 Checking domain on both chains...\n');
    
    // Check Arbitrum Sepolia
    console.log('🔍 Arbitrum Sepolia (Chain ID: 421614):');
    const arbContract = new ethers.Contract(arbFixedAddress, ABI, deployer);
    
    try {
      const arbIsAvailable = await arbContract.isAvailable(domainName);
      console.log(`   Available: ${arbIsAvailable}`);
      
      if (!arbIsAvailable) {
        const arbDomainInfo = await arbContract.getDomainInfo(domainName);
        console.log(`   Owner: ${arbDomainInfo[0]}`);
        console.log(`   Expires: ${new Date(Number(arbDomainInfo[1]) * 1000).toISOString()}`);
        console.log(`   Source Chain: ${arbDomainInfo[2].toString()}`);
        console.log(`   Is Omnichain: ${arbDomainInfo[3]}`);
        console.log(`   Is Expired: ${arbDomainInfo[4]}`);
        
        if (arbDomainInfo[3]) {
          console.log(`   ✅ Domain is omnichain enabled on Arbitrum Sepolia`);
        } else {
          console.log(`   ❌ Domain is NOT omnichain enabled on Arbitrum Sepolia`);
        }
      } else {
        console.log(`   ✅ Domain is available (not registered) on Arbitrum Sepolia`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking Arbitrum Sepolia: ${error.message}`);
    }
    
    console.log('');
    
    // Check Ethereum Sepolia
    console.log('🔍 Ethereum Sepolia (Chain ID: 11155111):');
    const ethContract = new ethers.Contract(ethFixedAddress, ABI, deployer);
    
    try {
      const ethIsAvailable = await ethContract.isAvailable(domainName);
      console.log(`   Available: ${ethIsAvailable}`);
      
      if (!ethIsAvailable) {
        const ethDomainInfo = await ethContract.getDomainInfo(domainName);
        console.log(`   Owner: ${ethDomainInfo[0]}`);
        console.log(`   Expires: ${new Date(Number(ethDomainInfo[1]) * 1000).toISOString()}`);
        console.log(`   Source Chain: ${ethDomainInfo[2].toString()}`);
        console.log(`   Is Omnichain: ${ethDomainInfo[3]}`);
        console.log(`   Is Expired: ${ethDomainInfo[4]}`);
        
        if (ethDomainInfo[3]) {
          console.log(`   ✅ Domain is omnichain enabled on Ethereum Sepolia`);
        } else {
          console.log(`   ❌ Domain is NOT omnichain enabled on Ethereum Sepolia`);
        }
      } else {
        console.log(`   ✅ Domain is available (not registered) on Ethereum Sepolia`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking Ethereum Sepolia: ${error.message}`);
    }
    
    console.log('\n📋 Cross-Chain Transfer Analysis:');
    console.log('================================');
    console.log('Domain Name: crosslan.zeta');
    console.log('');
    console.log('Expected behavior for successful cross-chain transfer:');
    console.log('1. Domain should be BURNED on source chain (available = true)');
    console.log('2. Domain should be MINTED on target chain (available = false)');
    console.log('3. Target chain should show new owner and omnichain status');
    console.log('');
    console.log('If both chains show "available = true", the transfer may have failed');
    console.log('If both chains show "available = false", the domain exists on both chains (not burned)');
    console.log('If one chain shows "available = true" and other shows "available = false", transfer was successful');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkCrosslanDomain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
