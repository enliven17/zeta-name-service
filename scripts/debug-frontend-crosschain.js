const { ethers } = require('hardhat');

async function debugFrontendCrosschain() {
  console.log('🔍 Debugging Frontend Cross-Chain Transfer Issue...\n');

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
    
    // Test domain name
    const domainName = "debugtest";
    
    console.log('📝 Step 1: Checking domain info...');
    const domainInfo = await contract.getDomainInfo(domainName);
    console.log('Domain info:', {
      owner: domainInfo[0],
      expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
      sourceChainId: domainInfo[2].toString(),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    });

    // Simulate frontend CrossChainTransfer component logic
    console.log('\n🌉 Step 2: Simulating Frontend CrossChainTransfer Logic...');
    
    const sourceChainId = currentChainId;
    const targetChainId = 11155111; // Ethereum Sepolia
    
    console.log('Source Chain ID:', sourceChainId);
    console.log('Target Chain ID:', targetChainId);
    console.log('Domain isOmnichain:', domainInfo[3]);
    
    // Check if domain is omnichain
    if (domainInfo[3]) {
      console.log('✅ Domain is configured for omnichain (cross-chain enabled)');
      
      // Check if cross-chain transfer is supported
      const isCrossChainSupported = (sourceChainId === 421614 && targetChainId === 11155111) || 
                                   (sourceChainId === 11155111 && targetChainId === 421614);
      
      if (isCrossChainSupported) {
        console.log('✅ Cross-chain transfer is supported between these chains');
        
        // Check if domain is eligible for transfer
        const isEligible = domainInfo[0] !== "0x0000000000000000000000000000000000000000" && 
                          !domainInfo[4] && 
                          domainInfo[3];
        
        if (isEligible) {
          console.log('✅ Domain is eligible for cross-chain transfer');
          console.log('✅ Frontend should enable cross-chain transfer button');
          
          // Test actual cross-chain transfer
          console.log('\n🌉 Step 3: Testing actual cross-chain transfer...');
          try {
            const crossChainTx = await contract.crossChainTransfer(
              domainName,
              deployer.address,
              targetChainId,
              {
                gasLimit: 1000000
              }
            );
            
            console.log('Cross-chain transfer transaction:', crossChainTx.hash);
            console.log('⏳ Waiting for transaction confirmation...');
            await crossChainTx.wait();
            console.log('✅ Cross-chain transfer initiated successfully!');
            
            // Check if domain was burned
            const domainInfoAfter = await contract.getDomainInfo(domainName);
            console.log('\nDomain info after transfer:', {
              owner: domainInfoAfter[0],
              isOmnichain: domainInfoAfter[3],
              isExpired: domainInfoAfter[4]
            });
            
            if (domainInfoAfter[0] === "0x0000000000000000000000000000000000000000") {
              console.log('✅ Domain was burned on source chain (transfer successful)');
            } else {
              console.log('❌ Domain still exists on source chain (transfer failed)');
            }
            
          } catch (error) {
            console.log('❌ Cross-chain transfer failed:', error.message);
          }
          
        } else {
          console.log('❌ Domain is NOT eligible for cross-chain transfer');
          if (domainInfo[0] === "0x0000000000000000000000000000000000000000") {
            console.log('   - Reason: Domain has no owner');
          }
          if (domainInfo[4]) {
            console.log('   - Reason: Domain has expired');
          }
          if (!domainInfo[3]) {
            console.log('   - Reason: Domain is not omnichain enabled');
          }
        }
        
      } else {
        console.log('❌ Cross-chain transfer is NOT supported between these chains');
        console.log('   - Supported routes: Arbitrum Sepolia ↔ Ethereum Sepolia');
      }
      
    } else {
      console.log('❌ Domain is NOT configured for omnichain (cross-chain disabled)');
      console.log('❌ Frontend should NOT show cross-chain transfer option');
      console.log('💡 This is why cross-chain transfer is not working!');
    }

    console.log('\n📋 Frontend Cross-Chain Debug Summary:');
    console.log('======================================');
    console.log('Domain Name:', domainName);
    console.log('Owner:', domainInfo[0]);
    console.log('Is Omnichain:', domainInfo[3]);
    console.log('Source Chain ID:', sourceChainId);
    console.log('Target Chain ID:', targetChainId);
    console.log('Cross-Chain Supported:', (sourceChainId === 421614 && targetChainId === 11155111) || (sourceChainId === 11155111 && targetChainId === 421614));
    console.log('Domain Eligible:', domainInfo[0] !== "0x0000000000000000000000000000000000000000" && !domainInfo[4] && domainInfo[3]);
    
    if (domainInfo[3] && (sourceChainId === 421614 && targetChainId === 11155111) || (sourceChainId === 11155111 && targetChainId === 421614)) {
      console.log('✅ Everything should work in frontend');
      console.log('✅ Cross-chain transfer should be enabled');
    } else {
      console.log('❌ Something is wrong with the configuration');
      console.log('💡 Check the issues above');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFrontendCrosschain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
