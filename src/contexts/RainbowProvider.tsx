"use client";

import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, getDefaultWallets } from '@rainbow-me/rainbowkit';
// Remove individual connector imports
import '@rainbow-me/rainbowkit/styles.css';

const ARB_SEPOLIA_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARB_SEPOLIA_CHAIN_ID || '421614');
const ARB_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
const ARB_SEPOLIA_EXPLORER_URL = process.env.NEXT_PUBLIC_ARB_SEPOLIA_EXPLORER_URL || 'https://sepolia.arbiscan.io';

const arbitrumSepolia = {
  id: ARB_SEPOLIA_CHAIN_ID,
  name: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [ARB_SEPOLIA_RPC_URL] } },
  blockExplorers: { default: { name: 'Arbiscan', url: ARB_SEPOLIA_EXPLORER_URL } },
} as const;

const { connectors } = getDefaultWallets({
  appName: 'Zeta Name Service',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '226b43b703188d269fb70d02c107c34e',
});

const config = createConfig({
  chains: [arbitrumSepolia as any],
  connectors,
  transports: { [arbitrumSepolia.id]: http(ARB_SEPOLIA_RPC_URL) },
  ssr: false,
});

const queryClient = new QueryClient();

export function RainbowProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({ accentColor: '#22c55e' })}
          modalSize="compact"
          initialChain={arbitrumSepolia}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


