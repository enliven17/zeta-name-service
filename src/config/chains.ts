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

// Supported chains configuration
export const supportedChains = [
  arbitrumSepolia,
  zetaChainTestnet,
  // Add more chains as needed
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
} as const

// Contract addresses by chain
export const contractAddresses = {
  [arbitrumSepolia.id]: {
    nameService: process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || '0xAaFE053F1D8402282c839aeb595218F30aa7DCC6',
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || '0x897FBB05A18ceE2d9451a9F644B9831DDf4Dd481',
    omnichain: process.env.NEXT_PUBLIC_OMNICHAIN_CONTRACT_ADDRESS || '0xAaFE053F1D8402282c839aeb595218F30aa7DCC6',
  },
  [zetaChainTestnet.id]: {
    nameService: process.env.NEXT_PUBLIC_ZETACHAIN_NAME_SERVICE_ADDRESS || '0x6F40A56250fbB57F5a17C815BE66A36804590669',
    marketplace: process.env.NEXT_PUBLIC_ZETACHAIN_MARKETPLACE_ADDRESS || '0x95bc083e6911DeBc46b36cDCE8996fAEB28bf9A6',
    omnichain: process.env.NEXT_PUBLIC_ZETACHAIN_NAME_SERVICE_ADDRESS || '0x6F40A56250fbB57F5a17C815BE66A36804590669',
  },
} as const

// ZetaChain protocol addresses
export const zetaProtocolAddresses = {
  connector: process.env.NEXT_PUBLIC_ZETA_CONNECTOR_ADDRESS || '',
  token: process.env.NEXT_PUBLIC_ZETA_TOKEN_ADDRESS || '',
  tss: process.env.NEXT_PUBLIC_TSS_ADDRESS || '',
} as const

// Cross-chain route configurations
export const crossChainRoutes = {
  // Arbitrum Sepolia to ZetaChain
  [`${arbitrumSepolia.id}-${zetaChainTestnet.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ETH',
    steps: ['Lock on source', 'ZetaChain processing', 'Mint on target'],
  },
  // ZetaChain to Arbitrum Sepolia
  [`${zetaChainTestnet.id}-${arbitrumSepolia.id}`]: {
    estimatedTime: '2-5 minutes',
    fee: '0.0001 ZETA',
    steps: ['Burn on source', 'ZetaChain processing', 'Unlock on target'],
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
  if (!chain) return ''
  return `${chain.blockExplorers.default.url}/tx/${txHash}`
}

export const getAddressUrl = (chainId: number, address: string) => {
  const chain = supportedChains.find(c => c.id === chainId)
  if (!chain) return ''
  return `${chain.blockExplorers.default.url}/address/${address}`
}