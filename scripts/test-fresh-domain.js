const { ethers } = require('hardhat');

async function testFreshDomain() {
  console.log('🔍 Testing Fresh Domain Registration and Cross-Chain Transfer...\n');

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
    
    // Use a fresh domain name
    const domainName = "freshdomain" + Date.now();
    
    console.log('📝 Step 1: Checking if domain is available...');
    const isAvailable = await contract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (!isAvailable) {
      console.log('❌ Domain is not available, trying another name...');
      const domainName2 = "freshdomain" + (Date.now() + 1);
      const isAvailable2 = await contract.isAvailable(domainName2);
      if (isAvailable2) {
        domainName = domainName2;
        console.log(`Using domain: ${domainName}.zeta`);
      } else {
        console.log('❌ No available domain found');
        return;
      }
    }

    console.log('\n📝 Step 2: Registering domain with omnichain enabled...');
    const registrationPrice = ethers.parseEther("0.001");
    
    try {
      const registerTx = await contract.register(domainName, true, { // true = omnichain
        value: registrationPrice,
        gasLimit: 200000
      });
      
      console.log('Registration transaction:', registerTx.hash);
      console.log('⏳ Waiting for transaction confirmation...');
      await registerTx.wait();
      console.log('✅ Domain registered successfully!');
    } catch (error) {
      console.log('❌ Registration failed:', error.message);
      return;
    }

    console.log('\n📊 Step 3: Checking domain info after registration...');
    const domainInfo = await contract.getDomainInfo(domainName);
    console.log('Domain info:', {
      owner: domainInfo[0],
      expiresAt: new Date(Number(domainInfo[1]) * 1000).toISOString(),
      sourceChainId: domainInfo[2].toString(),
      isOmnichain: domainInfo[3],
      isExpired: domainInfo[4]
    });

    // Check if domain is omnichain
    if (domainInfo[3]) {
      console.log('✅ Domain is configured for omnichain (cross-chain enabled)');
      
      // Test cross-chain transfer eligibility
      const sourceChainId = currentChainId;
      const targetChainId = 11155111; // Ethereum Sepolia
      
      console.log('\n🌉 Step 4: Testing cross-chain transfer eligibility...');
      console.log('Source Chain ID:', sourceChainId);
      console.log('Target Chain ID:', targetChainId);
      
      const isCrossChainSupported = (sourceChainId === 421614 && targetChainId === 11155111) || 
                                   (sourceChainId === 11155111 && targetChainId === 421614);
      
      if (isCrossChainSupported) {
        console.log('✅ Cross-chain transfer is supported between these chains');
        
        const isEligible = domainInfo[0] !== "0x0000000000000000000000000000000000000000" && 
                          !domainInfo[4] && 
                          domainInfo[3];
        
        if (isEligible) {
          console.log('✅ Domain is eligible for cross-chain transfer');
          console.log('✅ Frontend should enable cross-chain transfer button');
          
          // Test actual cross-chain transfer
          console.log('\n🌉 Step 5: Testing actual cross-chain transfer...');
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
        }
        
      } else {
        console.log('❌ Cross-chain transfer is NOT supported between these chains');
      }
      
    } else {
      console.log('❌ Domain is NOT configured for omnichain (cross-chain disabled)');
      console.log('💡 This is why cross-chain transfer is not working!');
    }

    console.log('\n📋 Fresh Domain Test Summary:');
    console.log('==============================');
    console.log('Domain Name:', domainName);
    console.log('Owner:', domainInfo[0]);
    console.log('Is Omnichain:', domainInfo[3]);
    console.log('Source Chain ID:', currentChainId);
    console.log('Target Chain ID:', 11155111);
    console.log('Cross-Chain Supported:', (currentChainId === 421614 && 11155111 === 11155111) || (currentChainId === 11155111 && 11155111 === 421614));
    console.log('Domain Eligible:', domainInfo[0] !== "0x0000000000000000000000000000000000000000" && !domainInfo[4] && domainInfo[3]);
    
    if (domainInfo[3]) {
      console.log('✅ Domain is properly configured for cross-chain transfers');
      console.log('✅ Frontend should work correctly');
      console.log('✅ Cross-chain transfer should be enabled');
    } else {
      console.log('❌ Domain is NOT configured for cross-chain transfers');
      console.log('💡 Fix: Re-register domain with omnichain=true');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFreshDomain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
