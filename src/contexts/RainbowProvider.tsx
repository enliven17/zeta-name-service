"use client";

import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, getDefaultWallets, Chain } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia, zetaChainTestnet, ethereumSepolia, bscTestnet, polygonMumbai, supportedChains } from '../config/chains';
import '@rainbow-me/rainbowkit/styles.css';

// Get RPC URLs from environment
const ARB_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const ZETACHAIN_TESTNET_RPC_URL = process.env.NEXT_PUBLIC_ZETACHAIN_TESTNET_RPC_URL || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';
const ETHEREUM_SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL || 'https://1rpc.io/sepolia';
const BSC_TESTNET_RPC_URL = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const POLYGON_MUMBAI_RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com';

const { connectors } = getDefaultWallets({
  appName: 'Zeta Name Service - Omnichain Domains',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '226b43b703188d269fb70d02c107c34e',
});

// Create wagmi config with multiple chains
const config = createConfig({
  chains: supportedChains as readonly [Chain, ...Chain[]],
  connectors,
  transports: {
    [arbitrumSepolia.id]: http(ARB_SEPOLIA_RPC_URL, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [zetaChainTestnet.id]: http(ZETACHAIN_TESTNET_RPC_URL, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [ethereumSepolia.id]: http(ETHEREUM_SEPOLIA_RPC_URL, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [bscTestnet.id]: http(BSC_TESTNET_RPC_URL, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [polygonMumbai.id]: http(POLYGON_MUMBAI_RPC_URL, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  ssr: false,
  multiInjectedProviderDiscovery: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (cacheTime is deprecated, use gcTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Custom theme for ZetaChain branding
const customTheme = darkTheme({
  accentColor: '#00D2FF', // ZetaChain blue
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function RainbowProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customTheme}
          modalSize="wide"
          showRecentTransactions={true}
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


