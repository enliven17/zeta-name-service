"use client";

import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia, zetaChainTestnet, supportedChains } from '../config/chains';
import '@rainbow-me/rainbowkit/styles.css';

// Get RPC URLs from environment
const ARB_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const ZETACHAIN_TESTNET_RPC_URL = process.env.NEXT_PUBLIC_ZETACHAIN_TESTNET_RPC_URL || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';

const { connectors } = getDefaultWallets({
  appName: 'Zeta Name Service - Omnichain Domains',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '226b43b703188d269fb70d02c107c34e',
});

// Create wagmi config with multiple chains
const config = createConfig({
  chains: supportedChains as any,
  connectors,
  transports: {
    [arbitrumSepolia.id]: http(ARB_SEPOLIA_RPC_URL),
    [zetaChainTestnet.id]: http(ZETACHAIN_TESTNET_RPC_URL),
  },
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customTheme}
          modalSize="compact"
          initialChain={arbitrumSepolia}
          showRecentTransactions={true}
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


