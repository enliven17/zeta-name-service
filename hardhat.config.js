require("@nomicfoundation/hardhat-toolbox");
// require("@moved/hardhat-plugin"); // disabled: causes ENOENT for Move packages
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
    // Arbitrum Sepolia configuration
    arbitrumSepolia: {
      url: process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: process.env.ARB_SEPOLIA_CHAIN_ID ? Number(process.env.ARB_SEPOLIA_CHAIN_ID) : 421614,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 300000,
    },
    // Optional: ZetaChain testnet (EVM side)
    zetachainTestnet: {
      url: process.env.RPC_ZETACHAIN || "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      chainId: process.env.ZETA_CHAIN_ID ? Number(process.env.ZETA_CHAIN_ID) : 7001,
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
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: process.env.ARB_SEPOLIA_CHAIN_ID ? Number(process.env.ARB_SEPOLIA_CHAIN_ID) : 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};