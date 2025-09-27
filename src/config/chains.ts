import { Chain } from 'wagmi/chains'

// ZetaChain Athens Testnet
export const zetaChainTestnet: Chain = {
  id: 7001,
  name: 'ZetaChain Athens Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZETA',
    symbol: 'ZETA',
  },
  rpcUrls: {
    default: {
      http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
    },
    public: {
      http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ZetaChain Athens Explorer',
      url: 'https://athens.explorer.zetachain.com',
    },
  },
  testnet: true,
}

// ZetaChain Mainnet
export const zetaChainMainnet: Chain = {
  id: 7000,
  name: 'ZetaChain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZETA',
    symbol: 'ZETA',
  },
  rpcUrls: {
    default: {
      http: ['https://zetachain-evm.blockpi.network/v1/rpc/public'],
    },
    public: {
      http: ['https://zetachain-evm.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ZetaChain Explorer',
      url: 'https://explorer.zetachain.com',
    },
  },
  testnet: false,
}

// Arbitrum Sepolia (already defined in wagmi but we'll customize)
export const arbitrumSepolia: Chain = {
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
}

// Ethereum Sepolia
export const ethereumSepolia: Chain = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://1rpc.io/sepolia'],
    },
    public: {
      http: ['https://1rpc.io/sepolia'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
}

// BSC Testnet
export const bscTestnet: Chain = {
  id: 97,
  name: 'BSC Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
    public: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://testnet.bscscan.com',
    },
  },
  testnet: true,
}

// Polygon Mumbai
export const polygonMumbai: Chain = {
  id: 80001,
  name: 'Polygon Mumbai',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mumbai.maticvigil.com'],
    },
    public: {
      http: ['https://rpc-mumbai.maticvigil.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com',
    },
  },
  testnet: true,
}

// Supported chains configuration
export const supportedChains = [
  arbitrumSepolia,
  zetaChainTestnet,
  ethereumSepolia,
  bscTestnet,
  polygonMumbai,
] as const

// Chain configurations for the application
export const chainConfigs = {
  [arbitrumSepolia.id]: {
    name: 'Arbitrum Sepolia',
    shortName: 'ARB',
    color: '#28A0F0',
    registrationPrice: '0.001',
    transferFee: '0.0001',
    listingFee: '0.0001',
    currency: 'ETH',
    isOmnichainHub: false,
    features: ['registration', 'transfer', 'marketplace', 'crosschain'],
  },
  [zetaChainTestnet.id]: {
    name: 'ZetaChain Testnet',
    shortName: 'ZETA',
    color: '#00D2FF',
    registrationPrice: '0.001',
    transferFee: '0.0001',
    listingFee: '0.0001',
    currency: 'ZETA',
    isOmnichainHub: true,
    features: ['registration', 'transfer', 'marketplace', 'crosschain', 'omnichain'],
  },
  [zetaChainMainnet.id]: {
    name: 'ZetaChain Mainnet',
    shortName: 'ZETA',
    color: '#00D2FF',
    registrationPrice: '0.001',
    transferFee: '0.0001',
    listingFee: '0.0001',
    currency: 'ZETA',
    isOmnichainHub: true,
    features: ['registration', 'transfer', 'marketplace', 'crosschain', 'omnichain'],
  },
  [ethereumSepolia.id]: {
    name: 'Ethereum Sepolia',
    shortName: 'ETH',
    color: '#627EEA',
    registrationPrice: '0.002',
    transferFee: '0.0002',
    listingFee: '0.0002',
    currency: 'ETH',
    isOmnichainHub: false,
    features: ['registration', 'transfer', 'marketplace', 'crosschain'],
  },
  [bscTestnet.id]: {
    name: 'BSC Testnet',
    shortName: 'BNB',
    color: '#F3BA2F',
    registrationPrice: '0.01',
    transferFee: '0.001',
    listingFee: '0.001',
    currency: 'BNB',
    isOmnichainHub: false,
    features: ['registration', 'transfer', 'marketplace', 'crosschain'],
  },
  [polygonMumbai.id]: {
    name: 'Polygon Mumbai',
    shortName: 'MATIC',
    color: '#8247E5',
    registrationPrice: '1.0',
    transferFee: '0.1',
    listingFee: '0.1',
    currency: 'MATIC',
    isOmnichainHub: false,
    features: ['registration', 'transfer', 'marketplace', 'crosschain'],
  },
} as const

// Contract addresses by chain
export const contractAddresses = {
  [arbitrumSepolia.id]: {
    nameService: process.env.NEXT_PUBLIC_ARB_NAME_SERVICE_ADDRESS || '0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd',
    marketplace: process.env.NEXT_PUBLIC_ARB_MARKETPLACE_ADDRESS || '0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd',
    omnichain: process.env.NEXT_PUBLIC_ARB_OMNICHAIN_ADDRESS || '0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd',
  },
  [zetaChainTestnet.id]: {
    nameService: process.env.NEXT_PUBLIC_ZETACHAIN_NAME_SERVICE_ADDRESS || '0x6F40A56250fbB57F5a17C815BE66A36804590669',
    marketplace: process.env.NEXT_PUBLIC_ZETACHAIN_MARKETPLACE_ADDRESS || '0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6',
    omnichain: process.env.NEXT_PUBLIC_ZETACHAIN_NAME_SERVICE_ADDRESS || '0x6F40A56250fbB57F5a17C815BE66A36804590669',
  },
  [ethereumSepolia.id]: {
    nameService: process.env.NEXT_PUBLIC_ETH_NAME_SERVICE_ADDRESS || '0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74',
    marketplace: process.env.NEXT_PUBLIC_ETH_MARKETPLACE_ADDRESS || '0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74',
    omnichain: process.env.NEXT_PUBLIC_ETH_OMNICHAIN_ADDRESS || '0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74',
  },
  [bscTestnet.id]: {
    nameService: process.env.NEXT_PUBLIC_BSC_NAME_SERVICE_ADDRESS || '',
    marketplace: process.env.NEXT_PUBLIC_BSC_MARKETPLACE_ADDRESS || '',
    omnichain: process.env.NEXT_PUBLIC_BSC_NAME_SERVICE_ADDRESS || '',
  },
  [polygonMumbai.id]: {
    nameService: process.env.NEXT_PUBLIC_POLYGON_NAME_SERVICE_ADDRESS || '',
    marketplace: process.env.NEXT_PUBLIC_POLYGON_MARKETPLACE_ADDRESS || '',
    omnichain: process.env.NEXT_PUBLIC_POLYGON_NAME_SERVICE_ADDRESS || '',
  },
} as const

// ZetaChain protocol addresses
export const zetaProtocolAddresses = {
  connector: process.env.NEXT_PUBLIC_ZETA_CONNECTOR_ADDRESS || '',
  token: process.env.NEXT_PUBLIC_ZETA_TOKEN_ADDRESS || '',
  tss: process.env.NEXT_PUBLIC_TSS_ADDRESS || '',
} as const

// ZetaChain Gateway addresses (doğru adresler)
export const zetaGatewayAddresses = {
  [arbitrumSepolia.id]: '0x0dA86Dc3F9B71F84a0E97B0e2291e50B7a5df10f',
  [ethereumSepolia.id]: '0x0c487a766110c85d301d96e33579c5b317fa4995',
  [bscTestnet.id]: '0x0c487a766110c85d301d96e33579c5b317fa4995',
  [polygonMumbai.id]: '0x0c487a766110c85d301d96e33579c5b317fa4995',
} as const

// Cross-chain route configurations
export const crossChainRoutes = {
  // Arbitrum Sepolia routes
  [`${arbitrumSepolia.id}-${zetaChainTestnet.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ETH',
    steps: ['Lock on Arbitrum', 'ZetaChain processing', 'Mint on ZetaChain'],
  },
  [`${arbitrumSepolia.id}-${ethereumSepolia.id}`]: {
    estimatedTime: '3-7 minutes',
    fee: '0.0002 ETH',
    steps: ['Lock on Arbitrum', 'ZetaChain bridge', 'Unlock on Ethereum'],
  },
  [`${arbitrumSepolia.id}-${bscTestnet.id}`]: {
    estimatedTime: '3-7 minutes',
    fee: '0.0002 ETH',
    steps: ['Lock on Arbitrum', 'ZetaChain bridge', 'Unlock on BSC'],
  },
  [`${arbitrumSepolia.id}-${polygonMumbai.id}`]: {
    estimatedTime: '3-7 minutes',
    fee: '0.0002 ETH',
    steps: ['Lock on Arbitrum', 'ZetaChain bridge', 'Unlock on Polygon'],
  },
  
  // ZetaChain routes (hub)
  [`${zetaChainTestnet.id}-${arbitrumSepolia.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ZETA',
    steps: ['Burn on ZetaChain', 'ZetaChain processing', 'Unlock on Arbitrum'],
  },
  [`${zetaChainTestnet.id}-${ethereumSepolia.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ZETA',
    steps: ['Burn on ZetaChain', 'ZetaChain processing', 'Unlock on Ethereum'],
  },
  [`${zetaChainTestnet.id}-${bscTestnet.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ZETA',
    steps: ['Burn on ZetaChain', 'ZetaChain processing', 'Unlock on BSC'],
  },
  [`${zetaChainTestnet.id}-${polygonMumbai.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ZETA',
    steps: ['Burn on ZetaChain', 'ZetaChain processing', 'Unlock on Polygon'],
  },
  
  // Ethereum Sepolia routes
  [`${ethereumSepolia.id}-${zetaChainTestnet.id}`]: {
    estimatedTime: '3-7 minutes',
    fee: '0.0002 ETH',
    steps: ['Lock on Ethereum', 'ZetaChain bridge', 'Mint on ZetaChain'],
  },
  [`${ethereumSepolia.id}-${arbitrumSepolia.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.0003 ETH',
    steps: ['Lock on Ethereum', 'ZetaChain bridge', 'Unlock on Arbitrum'],
  },
  [`${ethereumSepolia.id}-${bscTestnet.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.0003 ETH',
    steps: ['Lock on Ethereum', 'ZetaChain bridge', 'Unlock on BSC'],
  },
  [`${ethereumSepolia.id}-${polygonMumbai.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.0003 ETH',
    steps: ['Lock on Ethereum', 'ZetaChain bridge', 'Unlock on Polygon'],
  },
  
  // BSC Testnet routes
  [`${bscTestnet.id}-${zetaChainTestnet.id}`]: {
    estimatedTime: '3-7 minutes',
    fee: '0.001 BNB',
    steps: ['Lock on BSC', 'ZetaChain bridge', 'Mint on ZetaChain'],
  },
  [`${bscTestnet.id}-${arbitrumSepolia.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.002 BNB',
    steps: ['Lock on BSC', 'ZetaChain bridge', 'Unlock on Arbitrum'],
  },
  [`${bscTestnet.id}-${ethereumSepolia.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.002 BNB',
    steps: ['Lock on BSC', 'ZetaChain bridge', 'Unlock on Ethereum'],
  },
  [`${bscTestnet.id}-${polygonMumbai.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.002 BNB',
    steps: ['Lock on BSC', 'ZetaChain bridge', 'Unlock on Polygon'],
  },
  
  // Polygon Mumbai routes
  [`${polygonMumbai.id}-${zetaChainTestnet.id}`]: {
    estimatedTime: '3-7 minutes',
    fee: '0.1 MATIC',
    steps: ['Lock on Polygon', 'ZetaChain bridge', 'Mint on ZetaChain'],
  },
  [`${polygonMumbai.id}-${arbitrumSepolia.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.2 MATIC',
    steps: ['Lock on Polygon', 'ZetaChain bridge', 'Unlock on Arbitrum'],
  },
  [`${polygonMumbai.id}-${ethereumSepolia.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.2 MATIC',
    steps: ['Lock on Polygon', 'ZetaChain bridge', 'Unlock on Ethereum'],
  },
  [`${polygonMumbai.id}-${bscTestnet.id}`]: {
    estimatedTime: '5-10 minutes',
    fee: '0.2 MATIC',
    steps: ['Lock on Polygon', 'ZetaChain bridge', 'Unlock on BSC'],
  },
} as const

// Utility functions
export const getChainConfig = (chainId: number) => {
  return chainConfigs[chainId as keyof typeof chainConfigs]
}

export const getContractAddresses = (chainId: number) => {
  return contractAddresses[chainId as keyof typeof contractAddresses]
}

export const isChainSupported = (chainId: number) => {
  return chainId in chainConfigs
}

export const isCrossChainSupported = (fromChainId: number, toChainId: number) => {
  const routeKey = `${fromChainId}-${toChainId}`
  return routeKey in crossChainRoutes
}

export const getCrossChainRoute = (fromChainId: number, toChainId: number) => {
  const routeKey = `${fromChainId}-${toChainId}`
  return crossChainRoutes[routeKey as keyof typeof crossChainRoutes]
}

export const getExplorerUrl = (chainId: number, txHash: string) => {
  const chain = supportedChains.find(c => c.id === chainId)
  if (!chain || !chain.blockExplorers?.default?.url) return ''
  return `${chain.blockExplorers.default.url}/tx/${txHash}`
}

export const getAddressUrl = (chainId: number, address: string) => {
  const chain = supportedChains.find(c => c.id === chainId)
  if (!chain || !chain.blockExplorers?.default?.url) return ''
  return `${chain.blockExplorers.default.url}/address/${address}`
}