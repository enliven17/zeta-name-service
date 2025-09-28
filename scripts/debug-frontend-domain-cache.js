const { ethers } = require('hardhat');

async function debugFrontendDomainCache() {
  console.log('🔍 Debugging Frontend Domain Cache...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // FIXED Universal App contract addresses
  const arbFixedAddress = "0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd";

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
    
    // Test domain names that should exist
    const testDomains = ["cross1", "frontendtest"];
    
    console.log('📝 Checking domain info for existing domains...\n');
    
    for (const domainName of testDomains) {
      try {
        const isAvailable = await contract.isAvailable(domainName);
        
        if (!isAvailable) {
          console.log(`🔍 Domain: ${domainName}.zeta`);
          console.log(`   Available: ${isAvailable}`);
          
          const domainInfo = await contract.getDomainInfo(domainName);
          console.log(`   Raw Info:`, {
            owner: domainInfo[0],
            expiresAt: domainInfo[1].toString(),
            sourceChainId: domainInfo[2].toString(),
            isOmnichain: domainInfo[3],
            isExpired: domainInfo[4]
          });
          
          // Simulate frontend processing
          const processedInfo = {
            owner: domainInfo[0],
            expiresAt: Number(domainInfo[1]),
            sourceChainId: Number(domainInfo[2]),
            isOmnichain: domainInfo[3],
            isExpired: domainInfo[4]
          };
          
          console.log(`   Processed Info:`, {
            owner: processedInfo.owner,
            expiresAt: new Date(processedInfo.expiresAt * 1000).toISOString(),
            sourceChainId: processedInfo.sourceChainId,
            isOmnichain: processedInfo.isOmnichain,
            isExpired: processedInfo.isExpired
          });
          
          if (processedInfo.isOmnichain) {
            console.log(`   ✅ This domain IS omnichain enabled`);
            console.log(`   ✅ Frontend should show "Omnichain" badge`);
            console.log(`   ✅ Frontend should show "Cross-Chain" button`);
          } else {
            console.log(`   ❌ This domain is NOT omnichain enabled`);
            console.log(`   ❌ Frontend should show "ETH" badge`);
            console.log(`   ❌ Frontend should NOT show "Cross-Chain" button`);
          }
          
          console.log('');
        } else {
          console.log(`🔍 Domain: ${domainName}.zeta - Available (not registered)`);
        }
      } catch (error) {
        console.log(`❌ Error checking domain ${domainName}: ${error.message}`);
      }
    }
    
    console.log('\n📋 Frontend Domain Cache Debug Summary:');
    console.log('======================================');
    console.log('1. Check browser console for domain info loading logs');
    console.log('2. Look for: "🔍 Loading domain info for: domainname"');
    console.log('3. Look for: "📊 Domain info loaded: {...}"');
    console.log('4. Look for: "📊 Processed domain info: {...}"');
    console.log('5. Check if isOmnichain is true in the logs');
    console.log('6. If isOmnichain is true, frontend should show "Omnichain" badge');
    console.log('7. If isOmnichain is true, frontend should show "Cross-Chain" button');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFrontendDomainCache()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
