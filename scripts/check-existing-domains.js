const { ethers } = require('hardhat');

async function checkExistingDomains() {
  console.log('🔍 Checking Existing Domains...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // FIXED Universal App contract addresses
  const arbFixedAddress = "0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd";
  const ethFixedAddress = "0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74";

  const ABI = [
    "function isAvailable(string calldata name) external view returns (bool)",
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
    "function register(string calldata name, bool makeOmnichain) external payable",
    "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external",
    "function getSupportedChains() external view returns (uint256[] memory)"
  ];

  try {
    const contract = new ethers.Contract(arbFixedAddress, ABI, deployer);
    
    // Test some common domain names that might exist
    const testDomains = [
      "cross1",
      "debugtest", 
      "frontendtest",
      "finaltest",
      "freshdomain1759056739605",
      "testdomain1759057097589"
    ];
    
    console.log('📝 Checking existing domains...\n');
    
    for (const domainName of testDomains) {
      try {
        const isAvailable = await contract.isAvailable(domainName);
        
        if (!isAvailable) {
          console.log(`🔍 Domain: ${domainName}.zeta`);
          console.log(`   Available: ${isAvailable}`);
          
          try {
            const domainInfo = await contract.getDomainInfo(domainName);
            console.log(`   Owner: ${domainInfo[0]}`);
            console.log(`   Expires: ${new Date(Number(domainInfo[1]) * 1000).toISOString()}`);
            console.log(`   Source Chain: ${domainInfo[2].toString()}`);
            console.log(`   Is Omnichain: ${domainInfo[3]}`);
            console.log(`   Is Expired: ${domainInfo[4]}`);
            
            if (domainInfo[3]) {
              console.log(`   ✅ This domain IS omnichain enabled`);
            } else {
              console.log(`   ❌ This domain is NOT omnichain enabled`);
            }
            
            console.log('');
          } catch (error) {
            console.log(`   ❌ Error getting domain info: ${error.message}`);
            console.log('');
          }
        } else {
          console.log(`🔍 Domain: ${domainName}.zeta - Available (not registered)`);
        }
      } catch (error) {
        console.log(`❌ Error checking domain ${domainName}: ${error.message}`);
      }
    }
    
    // Register a fresh domain with omnichain enabled
    console.log('\n📝 Registering a fresh domain with omnichain enabled...');
    const freshDomainName = "omnichaintest" + Date.now();
    
    try {
      const registrationPrice = ethers.parseEther("0.001");
      const registerTx = await contract.register(freshDomainName, true, { // true = omnichain
        value: registrationPrice,
        gasLimit: 200000
      });
      
      console.log('Registration transaction:', registerTx.hash);
      console.log('⏳ Waiting for transaction confirmation...');
      await registerTx.wait();
      console.log('✅ Domain registered successfully!');
      
      // Check the domain info immediately
      console.log('\n📊 Checking domain info immediately after registration...');
      const domainInfo = await contract.getDomainInfo(freshDomainName);
      console.log('Domain info:', {
        owner: domainInfo[0],
        expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
        sourceChainId: domainInfo[2].toString(),
        isOmnichain: domainInfo[3],
        isExpired: domainInfo[4]
      });
      
      if (domainInfo[3]) {
        console.log('✅ Domain is omnichain enabled - should show cross-chain button in frontend');
      } else {
        console.log('❌ Domain is NOT omnichain enabled - this is a problem!');
      }
      
    } catch (error) {
      console.log('❌ Registration failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkExistingDomains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
