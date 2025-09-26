"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// WalletConnect auto-init disabled in dev; RainbowKit handles connections
// import { EthereumProvider } from '@walletconnect/ethereum-provider';
// RainbowKit will be used for connection UI; this context remains for app state

// Arbitrum Sepolia network configuration (target network)
const ARB_SEPOLIA_CONFIG = {
  chainId: '0x66EED', // 421614 in hex
  chainName: 'Arbitrum Sepolia',
  rpcUrls: [process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: [process.env.NEXT_PUBLIC_ARB_SEPOLIA_EXPLORER_URL || 'https://sepolia.arbiscan.io'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Unused alt config removed

// Common testnet configurations to try
const TESTNET_CONFIGS = [
  {
    chainId: '0x1A4', // 420 in hex (Optimism Goerli)
    chainName: 'Optimism Goerli',
    rpcUrls: ['https://goerli.optimism.io'],
    blockExplorerUrls: ['https://goerli-optimism.etherscan.io'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    chainId: '0x66EED', // 421614 in hex (Arbitrum Sepolia)
    chainName: 'Arbitrum Sepolia',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  }
];

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connect: (walletType: 'metamask' | 'okx' | 'walletconnect') => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  walletType: 'metamask' | 'okx' | 'walletconnect' | null;
  isUmiNetwork: boolean;
  switchToUmiNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
  }
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletType, setWalletType] = useState<'metamask' | 'okx' | 'walletconnect' | null>(null);
  const [isUmiNetwork, setIsUmiNetwork] = useState(false); // kept name for compatibility; now means Arbitrum Sepolia
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(null);

  // WalletConnect disabled – use RainbowKit only
  useEffect(() => {}, []);

  // Auto-connect disabled - user must manually connect

  // Check if connected to Arbitrum Sepolia
  const checkNetwork = async () => {
    let provider = window.ethereum;
    
    // Use WalletConnect provider if connected via WalletConnect
    if (walletType === 'walletconnect' && walletConnectProvider) {
      provider = walletConnectProvider;
    }
    
    if (!provider) {
      console.log('No ethereum provider found');
      setIsUmiNetwork(false);
      return false;
    }
    
    try {
      const chainId = await provider.request({ method: 'eth_chainId' });
      const isUmi = chainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase();
      console.log('Network check - Current chain ID:', chainId, 'Expected:', ARB_SEPOLIA_CONFIG.chainId, 'Is ArbitrumSepolia:', isUmi);
      
      // Force state update
      setIsUmiNetwork(isUmi);
      
      // Double check the state was set
      setTimeout(() => {
        console.log('State after checkNetwork - isUmiNetwork:', isUmi);
      }, 100);
      
      return isUmi;
    } catch (error) {
      console.error('Error checking network:', error);
      setIsUmiNetwork(false);
      return false;
    }
  };

  // Switch to Arbitrum Sepolia
  const switchToUmiNetwork = async () => {
    let provider = window.ethereum;
    
    // Use WalletConnect provider if connected via WalletConnect
    if (walletType === 'walletconnect' && walletConnectProvider) {
      provider = walletConnectProvider;
    }
    
    if (!provider) {
      throw new Error('Ethereum sağlayıcısı bulunamadı');
    }

    try {
      console.log('Attempting to switch to Arbitrum Sepolia...');
      console.log('Target chain ID:', ARB_SEPOLIA_CONFIG.chainId);
      
      // Check current chain first
      const currentChainId = await provider.request({ method: 'eth_chainId' });
      console.log('Current chain ID before switch:', currentChainId);
      
      // If already on the correct chain, just update state
      if (currentChainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase()) {
        console.log('Already on Arbitrum Sepolia');
        setIsUmiNetwork(true);
        return;
      }

      // First try to switch to the chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARB_SEPOLIA_CONFIG.chainId }],
      });
      
      // Wait a bit for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the switch was successful
      const newChainId = await provider.request({ method: 'eth_chainId' });
      console.log('Chain ID after switch attempt:', newChainId);
      
      if (newChainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase()) {
        console.log('Successfully switched to Arbitrum Sepolia');
        setIsUmiNetwork(true);
      } else {
        console.log('Switch failed - chain ID mismatch');
        console.log('Expected:', ARB_SEPOLIA_CONFIG.chainId, 'Got:', newChainId);
        throw new Error('Failed to switch to Arbitrum Sepolia - chain ID mismatch');
      }
      
    } catch (switchError: any) {
      console.log('Switch error:', switchError);
      
      // Always try to add the chain first, regardless of error code
      console.log('Attempting to add Arbitrum Sepolia to wallet...');
      
      try {
        // Add the chain
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [ARB_SEPOLIA_CONFIG],
        });
        
        console.log('Successfully added Arbitrum Sepolia to wallet');
        
        // Wait for the addition to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Now try to switch to the newly added chain
        console.log('Attempting to switch to newly added Arbitrum Sepolia...');
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ARB_SEPOLIA_CONFIG.chainId }],
        });
        
        // Wait for the switch to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify the switch was successful
        const chainId = await provider.request({ method: 'eth_chainId' });
        console.log('Chain ID after adding and switching:', chainId);
        
        if (chainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase()) {
          console.log('Successfully added and switched to Arbitrum Sepolia');
          setIsUmiNetwork(true);
        } else {
          console.log('Added but switch failed - chain ID mismatch');
          console.log('Expected:', ARB_SEPOLIA_CONFIG.chainId, 'Got:', chainId);
          
          // Try one more time with a different approach
          console.log('Trying alternative switch method...');
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ARB_SEPOLIA_CONFIG.chainId }],
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            const finalChainId = await provider.request({ method: 'eth_chainId' });
            console.log('Final chain ID after retry:', finalChainId);
            
            if (finalChainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase()) {
              console.log('Successfully switched to Arbitrum Sepolia on retry');
              setIsUmiNetwork(true);
            } else {
              throw new Error('Failed to switch to Arbitrum Sepolia after multiple attempts');
            }
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            throw new Error('Arbitrum Sepolia eklendikten sonra geçiş yapılamadı. Lütfen cüzdanınızdan manuel olarak Arbitrum Sepolia\'ya geçin.');
          }
        }
        
      } catch (addError) {
        console.error('Error adding Arbitrum Sepolia:', addError);
        throw new Error('Arbitrum Sepolia cüzdanınıza eklenemedi. Lütfen manuel olarak aşağıdaki bilgilerle ekleyin:\n\nAğ Adı: Arbitrum Sepolia\nRPC URL: https://sepolia-rollup.arbitrum.io/rpc\nChain ID: 421614\nPara Birimi: ETH\nBlock Explorer: https://sepolia.arbiscan.io');
      }
    }
  };

  const connect = async (walletType: 'metamask' | 'okx' | 'walletconnect') => {
    setIsLoading(true);
    
    try {
      let provider;
      
      switch (walletType) {
        case 'metamask':
          if (!window.ethereum) {
            throw new Error('MetaMask yüklü değil. Devam etmek için lütfen MetaMask\'ı yükleyin.');
          }
          provider = window.ethereum;
          break;
          
        case 'okx':
          if (!window.okxwallet) {
            throw new Error('OKX Wallet yüklü değil. Devam etmek için lütfen OKX Wallet\'ı yükleyin.');
          }
          provider = window.okxwallet;
          break;
          
        case 'walletconnect':
          if (!walletConnectProvider) {
            throw new Error('WalletConnect başlatılamadı. Lütfen sayfayı yenileyin.');
          }
          provider = walletConnectProvider;
          console.log('Using WalletConnect provider');
          break;
          
        default:
          throw new Error('Unsupported wallet type');
      }

      // Request account access
      let accounts: string[];
      
      if (walletType === 'walletconnect') {
        // For WalletConnect, use enable() method
        console.log('Connecting via WalletConnect - QR code should appear');
        try {
          await provider.enable();
          accounts = provider.accounts;
          console.log('WalletConnect connected successfully');
        } catch (wcError: any) {
          // Handle WalletConnect specific errors
          if (wcError.message?.includes('Connection request reset') || 
              wcError.message?.includes('User rejected') ||
              wcError.message?.includes('User cancelled') ||
              wcError.code === 4001) {
            console.log('WalletConnect connection cancelled by user');
            return; // Exit silently without showing error
          }
          throw wcError; // Re-throw other errors
        }
      } else {
        // For MetaMask and OKX, check for pending requests first
        try {
          // Check if already connected
          const existingAccounts = await provider.request({ method: 'eth_accounts' });
          if (existingAccounts && existingAccounts.length > 0) {
            accounts = existingAccounts;
          } else {
            accounts = await provider.request({ method: 'eth_requestAccounts' });
          }
        } catch (requestError: any) {
          if (requestError.code === -32002) {
            throw new Error('Cüzdan bağlantı isteği zaten beklemede. Lütfen cüzdanınızı kontrol edin.');
          }
          throw requestError;
        }
      }
      
      if (accounts.length === 0) {
        throw new Error('Hesap bulunamadı');
      }

      const userAddress = accounts[0];
      
      // For WalletConnect, check network using the provider directly
      let isUmi = false;
      if (walletType === 'walletconnect') {
        try {
          const chainId = await provider.request({ method: 'eth_chainId' });
          isUmi = chainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase();
          console.log('WalletConnect network check - Chain ID:', chainId, 'Is ArbitrumSepolia:', isUmi);
        } catch (error) {
          console.error('Error checking WalletConnect network:', error);
        }
      } else {
        // For other wallets, use the regular checkNetwork function
        isUmi = await checkNetwork();
      }
      
      if (false) {
        // Optionally switch to Arbitrum Sepolia
        try {
          console.log('Attempting to switch to Arbitrum Sepolia...');
          await switchToUmiNetwork();
          console.log('Successfully switched to Arbitrum Sepolia');
        } catch (error) {
          console.error('Failed to switch to Arbitrum Sepolia:', error);
          // Optional: enforce network
          // throw new Error('Bu uygulama Arbitrum Sepolia üzerinde çalışır. Lütfen cüzdanınızı Arbitrum Sepolia\'ya geçirin.');
        }
      }

      setAddress(userAddress);
      setWalletType(walletType);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem('walletAddress', userAddress);
      localStorage.setItem('walletType', walletType);
      
      console.log(`Connected to ${walletType} with address:`, userAddress);
      
      // Update network state
      setIsUmiNetwork(isUmi);
      
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      // Don't show error for user cancellation
      if (error.message?.includes('Connection request reset') || 
          error.message?.includes('User rejected') ||
          error.message?.includes('User cancelled') ||
          error.code === 4001) {
        console.log('Connection cancelled by user');
        return; // Exit silently
      }
      
      // Show error for other cases
      alert(error.message || 'Cüzdan bağlantısı başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    // Disconnect WalletConnect if it's the current wallet
    if (walletType === 'walletconnect' && walletConnectProvider) {
      try {
        walletConnectProvider.disconnect();
      } catch (e) {
        console.error('WalletConnect disconnect error:', e);
      }
    }
    
    setIsConnected(false);
    setAddress(null);
    setWalletType(null);
    setIsUmiNetwork(false);
    setWalletConnectProvider(null);
    
    // Clear localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    
    console.log('Wallet disconnected');
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        const isUmi = chainId.toLowerCase() === ARB_SEPOLIA_CONFIG.chainId.toLowerCase();
        console.log('Chain changed - New chain ID:', chainId, 'Is ArbitrumSepolia:', isUmi);
        setIsUmiNetwork(isUmi);
        
        if (!isUmi && isConnected) {
          console.warn('Please switch to Arbitrum Sepolia to use this application.');
          // Optionally disconnect user if they switch away from Umi Devnet
          // disconnect();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isConnected]);

  const value: WalletContextType = {
    isConnected,
    address,
    connect,
    disconnect,
    isLoading,
    walletType,
    isUmiNetwork,
    switchToUmiNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 