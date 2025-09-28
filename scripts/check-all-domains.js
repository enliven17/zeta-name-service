const { ethers } = require('hardhat');

async function checkAllDomains() {
  console.log('🔍 Checking all registered domains...\n');

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

  // Test various domain names that might exist
  const testDomains = [
    "crosslan",
    "cross1", 
    "frontendtest",
    "omni1",
    "testdomain",
    "debugtest",
    "finaltest",
    "freshdomain"
  ];
  
  try {
    console.log('📝 Checking domains on both chains...\n');
    
    // Check Arbitrum Sepolia
    console.log('🔍 Arbitrum Sepolia (Chain ID: 421614):');
    const arbContract = new ethers.Contract(arbFixedAddress, ABI, deployer);
    
    for (const domainName of testDomains) {
      try {
        const isAvailable = await arbContract.isAvailable(domainName);
        
        if (!isAvailable) {
          console.log(`   📝 ${domainName}.zeta:`);
          const domainInfo = await arbContract.getDomainInfo(domainName);
          console.log(`      Owner: ${domainInfo[0]}`);
          console.log(`      Expires: ${new Date(Number(domainInfo[1]) * 1000).toISOString()}`);
          console.log(`      Source Chain: ${domainInfo[2].toString()}`);
          console.log(`      Is Omnichain: ${domainInfo[3]}`);
          console.log(`      Is Expired: ${domainInfo[4]}`);
          console.log('');
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${domainName}: ${error.message}`);
      }
    }
    
    console.log('🔍 Ethereum Sepolia (Chain ID: 11155111):');
    const ethContract = new ethers.Contract(ethFixedAddress, ABI, deployer);
    
    for (const domainName of testDomains) {
      try {
        const isAvailable = await ethContract.isAvailable(domainName);
        
        if (!isAvailable) {
          console.log(`   📝 ${domainName}.zeta:`);
          const domainInfo = await ethContract.getDomainInfo(domainName);
          console.log(`      Owner: ${domainInfo[0]}`);
          console.log(`      Expires: ${new Date(Number(domainInfo[1]) * 1000).toISOString()}`);
          console.log(`      Source Chain: ${domainInfo[2].toString()}`);
          console.log(`      Is Omnichain: ${domainInfo[3]}`);
          console.log(`      Is Expired: ${domainInfo[4]}`);
          console.log('');
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${domainName}: ${error.message}`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('This shows all registered domains on both chains.');
    console.log('If a domain appears on both chains, cross-chain transfer may have failed.');
    console.log('If a domain appears on only one chain, it may have been transferred successfully.');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkAllDomains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
