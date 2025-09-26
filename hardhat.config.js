require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: process.env.NETWORK || "arbitrumSepolia",
  networks: {
    // Arbitrum Sepolia - Primary Network
    arbitrumSepolia: {
      url: process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: process.env.ARB_SEPOLIA_CHAIN_ID ? Number(process.env.ARB_SEPOLIA_CHAIN_ID) : 421614,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
      gasPrice: "auto",
    },
    
    // ZetaChain Athens Testnet - Omnichain Hub
    zetachainTestnet: {
      url: process.env.RPC_ZETACHAIN || "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      chainId: process.env.ZETA_CHAIN_ID ? Number(process.env.ZETA_CHAIN_ID) : 7001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
      gasPrice: 100000000000, // 100 gwei
      gas: 8000000,
    },

    // ZetaChain Mainnet (for future deployment)
    zetachainMainnet: {
      url: process.env.NEXT_PUBLIC_ZETACHAIN_MAINNET_RPC_URL || "https://zetachain-evm.blockpi.network/v1/rpc/public",
      chainId: 7000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
    },

    // Ethereum Sepolia - Cross-chain support
    ethereumSepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
    },

    // BSC Testnet - Cross-chain support
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
    },

    // Polygon Mumbai - Cross-chain support
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
    },

    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Hardhat network for testing
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
        enabled: false,
      },
    },
  },
  
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        }
      },
      {
        network: "zetachainTestnet",
        chainId: 7001,
        urls: {
          apiURL: "https://athens.explorer.zetachain.com/api",
          browserURL: "https://athens.explorer.zetachain.com",
        }
      }
    ]
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 300000,
  },
};