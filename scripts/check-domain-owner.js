const { ethers } = require('hardhat');

// Contract addresses
const ETHEREUM_SEPOLIA_CONTRACT = '0x19E88E3790A43721faD03CD5A68A100E18F40c4E';
const ARBITRUM_SEPOLIA_CONTRACT = '0xAaFE053F1D8402282c839aeb595218F30aa7DCC6';

// Contract ABI (minimal)
const ABI = [
    "function ownerOf(string calldata name) external view returns (address)",
    "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)"
];

async function checkDomainOwner() {
    console.log('🔍 Checking deneme.zeta domain ownership...\n');

    try {
        // Ethereum Sepolia provider
        const ethProvider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');
        const ethContract = new ethers.Contract(ETHEREUM_SEPOLIA_CONTRACT, ABI, ethProvider);

        // Arbitrum Sepolia provider  
        const arbProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
        const arbContract = new ethers.Contract(ARBITRUM_SEPOLIA_CONTRACT, ABI, arbProvider);

        console.log('📍 Ethereum Sepolia Contract:', ETHEREUM_SEPOLIA_CONTRACT);
        console.log('📍 Arbitrum Sepolia Contract:', ARBITRUM_SEPOLIA_CONTRACT);
        console.log('');

        // Check on Ethereum Sepolia
        try {
            console.log('🔍 Checking on Ethereum Sepolia...');
            const ethOwner = await ethContract.ownerOf('deneme');
            console.log('✅ ETH Owner:', ethOwner);

            try {
                const ethDomainInfo = await ethContract.getDomainInfo('deneme');
                console.log('📊 ETH Domain Info:', {
                    owner: ethDomainInfo[0],
                    expiresAt: new Date(Number(ethDomainInfo[1]) * 1000).toISOString(),
                    sourceChainId: ethDomainInfo[2].toString(),
                    isOmnichain: ethDomainInfo[3],
                    isExpired: ethDomainInfo[4]
                });
            } catch (e) {
                console.log('⚠️ ETH getDomainInfo failed:', e.message);
            }
        } catch (error) {
            console.log('❌ ETH Error:', error.message);
        }

        console.log('');

        // Check on Arbitrum Sepolia
        try {
            console.log('🔍 Checking on Arbitrum Sepolia...');
            const arbOwner = await arbContract.ownerOf('deneme');
            console.log('✅ ARB Owner:', arbOwner);

            try {
                const arbDomainInfo = await arbContract.getDomainInfo('deneme');
                console.log('📊 ARB Domain Info:', {
                    owner: arbDomainInfo[0],
                    expiresAt: new Date(Number(arbDomainInfo[1]) * 1000).toISOString(),
                    sourceChainId: arbDomainInfo[2].toString(),
                    isOmnichain: arbDomainInfo[3],
                    isExpired: arbDomainInfo[4]
                });
            } catch (e) {
                console.log('⚠️ ARB getDomainInfo failed:', e.message);
            }
        } catch (error) {
            console.log('❌ ARB Error:', error.message);
        }

        console.log('');
        console.log('🎯 Transfer Status Analysis:');
        console.log('- If ETH shows zero address (0x000...): Domain was transferred OUT');
        console.log('- If ARB shows your address: Domain was transferred IN successfully');
        console.log('- If both show same address: Transfer might be pending or failed');

    } catch (error) {
        console.error('💥 Script Error:', error);
    }
}

checkDomainOwner()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });