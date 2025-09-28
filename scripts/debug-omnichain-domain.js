const { ethers } = require('hardhat');

async function debugOmnichainDomain() {
  console.log('🔍 Debugging Omnichain Domain Issue...\n');

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
    
    console.log('📝 Step 1: Checking if domain exists...');
    const isAvailable = await contract.isAvailable(domainName);
    console.log(`Domain "${domainName}.zeta" is available:`, isAvailable);

    if (isAvailable) {
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
    } else {
      console.log('Domain already exists, checking current status...');
    }

    console.log('\n📊 Step 3: Checking domain info...');
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
    } else {
      console.log('❌ Domain is NOT configured for omnichain (cross-chain disabled)');
      console.log('💡 This is why cross-chain transfer is not working!');
      
      // Try to understand why it's not omnichain
      console.log('\n🔍 Debugging omnichain issue...');
      console.log('Domain source chain ID:', domainInfo[2].toString());
      console.log('Current chain ID:', currentChainId.toString());
      console.log('Are they the same?', domainInfo[2].toString() === currentChainId.toString());
    }

    // Check supported chains
    console.log('\n📋 Step 4: Checking supported chains...');
    try {
      const supportedChains = await contract.getSupportedChains();
      console.log('Supported chains:', supportedChains.map(id => id.toString()));
    } catch (error) {
      console.log('Could not get supported chains:', error.message);
    }

    // Test cross-chain transfer if domain is omnichain
    if (domainInfo[3]) {
      console.log('\n🌉 Step 5: Testing cross-chain transfer...');
      const targetChainId = 11155111; // Ethereum Sepolia
      
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
        
        if (error.message.includes('Domain is not omnichain enabled')) {
          console.log('💡 Error confirms: Domain is not configured for omnichain');
        } else if (error.message.includes('insufficient funds')) {
          console.log('💡 Error: Insufficient funds for gas fees');
        } else {
          console.log('💡 Other error - check the details above');
        }
      }
    } else {
      console.log('\n❌ Cannot test cross-chain transfer - domain is not omnichain enabled');
      console.log('💡 Solution: Re-register the domain with omnichain enabled');
    }

    console.log('\n📋 Debug Summary:');
    console.log('==================');
    console.log('Domain Name:', domainName);
    console.log('Owner:', domainInfo[0]);
    console.log('Is Omnichain:', domainInfo[3]);
    console.log('Source Chain ID:', domainInfo[2].toString());
    console.log('Current Chain ID:', currentChainId.toString());
    
    if (domainInfo[3]) {
      console.log('✅ Domain is properly configured for cross-chain transfers');
    } else {
      console.log('❌ Domain is NOT configured for cross-chain transfers');
      console.log('💡 Fix: Re-register domain with omnichain=true');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugOmnichainDomain()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
