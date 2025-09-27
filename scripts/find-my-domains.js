const { ethers } = require('hardhat');

// Contract addresses
const ETHEREUM_SEPOLIA_CONTRACT = '0x19E88E3790A43721faD03CD5A68A100E18F40c4E';
const ARBITRUM_SEPOLIA_CONTRACT = '0xAaFE053F1D8402282c839aeb595218F30aa7DCC6';

const ABI = [
  "function ownerOf(string calldata name) external view returns (address)",
  "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
  "function isAvailable(string calldata name) external view returns (bool)"
];

async function findMyDomains() {
  console.log('🔍 Finding all domains owned by 0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123...\n');

  const ownerAddress = '0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123';

  // Common domain names to check
  const domainNames = [
    'cross', 'test', 'zeta', 'domain', 'example', 'sample',
    'deneme', 'crosschain', 'transfer', 'yummy', 'credit',
    'name', 'service', 'blockchain', 'web3', 'crypto'
  ];

  try {
    // Providers
    const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
    const arbProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');

    // Contracts
    const ethContract = new ethers.Contract(ETHEREUM_SEPOLIA_CONTRACT, ABI, ethProvider);
    const arbContract = new ethers.Contract(ARBITRUM_SEPOLIA_CONTRACT, ABI, arbProvider);

    console.log('📊 Checking Ethereum Sepolia:');
    console.log('==============================\n');

    const ethDomains = [];

    for (const domainName of domainNames) {
      try {
        const owner = await ethContract.ownerOf(domainName);
        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          const info = await ethContract.getDomainInfo(domainName);
          ethDomains.push({
            name: domainName,
            info: {
              owner: info[0],
              expiresAt: new Date(Number(info[1]) * 1000).toISOString(),
              sourceChainId: Number(info[2]),
              isOmnichain: info[3],
              isExpired: info[4]
            }
          });
          console.log(`✅ ${domainName}.zeta - Owner: ${owner}`);
        }
      } catch (e) {
        // Domain doesn't exist or other error, skip
      }
    }

    console.log(`\n📊 Found ${ethDomains.length} domains on Ethereum Sepolia\n`);

    console.log('📊 Checking Arbitrum Sepolia:');
    console.log('=============================\n');

    const arbDomains = [];

    for (const domainName of domainNames) {
      try {
        const owner = await arbContract.ownerOf(domainName);
        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          const info = await arbContract.getDomainInfo(domainName);
          arbDomains.push({
            name: domainName,
            info: {
              owner: info[0],
              expiresAt: new Date(Number(info[1]) * 1000).toISOString(),
              sourceChainId: Number(info[2]),
              isOmnichain: info[3],
              isExpired: info[4]
            }
          });
          console.log(`✅ ${domainName}.zeta - Owner: ${owner}`);
        }
      } catch (e) {
        // Domain doesn't exist or other error, skip
      }
    }

    console.log(`\n📊 Found ${arbDomains.length} domains on Arbitrum Sepolia\n`);

    if (ethDomains.length > 0) {
      console.log('🎯 Ethereum Sepolia Domains:');
      ethDomains.forEach(domain => {
        console.log(`- ${domain.name}.zeta (${domain.info.isOmnichain ? 'omnichain' : 'regular'}) - Expires: ${domain.info.expiresAt}`);
      });
    }

    if (arbDomains.length > 0) {
      console.log('🎯 Arbitrum Sepolia Domains:');
      arbDomains.forEach(domain => {
        console.log(`- ${domain.name}.zeta (${domain.info.isOmnichain ? 'omnichain' : 'regular'}) - Expires: ${domain.info.expiresAt}`);
      });
    }

    if (ethDomains.length === 0 && arbDomains.length === 0) {
      console.log('❌ No domains found for this address');
      console.log('💡 Try registering a new domain first');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

findMyDomains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });