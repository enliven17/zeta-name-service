import { ethers } from 'ethers'
import { getContractAddresses, getChainConfig } from '../config/chains'

// Omnichain Zeta Name Service ABI
const OMNICHAIN_NAME_SERVICE_ABI = [
  // Read functions
  "function isAvailable(string calldata name) external view returns (bool)",
  "function ownerOf(string calldata name) external view returns (address)",
  "function expiresAt(string calldata name) external view returns (uint64)",
  "function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)",
  "function getSupportedChains() external view returns (uint256[] memory)",
  "function getChainConfig(uint256 chainId) external view returns (tuple(bool isSupported, uint256 registrationPrice, uint256 transferFee, string rpcUrl, string explorerUrl))",
  
  // Write functions
  "function register(string calldata name, bool makeOmnichain) external payable",
  "function renew(string calldata name) external payable",
  "function transfer(string calldata name, address to) external payable",
  "function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable",
  
  // Constants
  "function BASE_REGISTRATION_PRICE() view returns (uint256)",
  "function BASE_TRANSFER_FEE() view returns (uint256)",
]

// Get contract address based on current chain
const getContractAddress = (chainId: number): string => {
  const addresses = getContractAddresses(chainId)
  return addresses?.nameService || '0x0000000000000000000000000000000000000000'
}

const DOMAIN_PRICE = ethers.parseEther('0.001') // 0.001 ETH
const TRANSFER_FEE = ethers.parseEther('0.0001')  // 0.0001 ETH

export class OmnichainZetaNameServiceContract {
  private contract!: ethers.Contract
  private signer: unknown
  private provider: unknown
  private chainId!: number

  constructor(provider: unknown, chainId?: number) {
    this.provider = provider
    this.signer = (provider as any).getSigner ? (provider as any).getSigner() : provider
    
    // Get chain ID from provider if not provided
    if (!chainId) {
      if ((provider as any).getNetwork) {
        (provider as any).getNetwork().then((network: any) => {
          this.chainId = Number(network.chainId)
          this.initializeContract()
        })
      } else {
        this.chainId = 421614 // Default to Arbitrum Sepolia
        this.initializeContract()
      }
    } else {
      this.chainId = chainId
      this.initializeContract()
    }
  }

  private initializeContract() {
    const contractAddress = getContractAddress(this.chainId)
    this.contract = new ethers.Contract(contractAddress, OMNICHAIN_NAME_SERVICE_ABI, this.provider as any)
    
    console.log('🔗 Omnichain contract initialized:', contractAddress);
    console.log('🌐 Chain ID:', this.chainId);
    console.log('🔗 Provider:', this.provider);
  }

  // Check if domain is available on-chain
  async isDomainAvailable(domainName: string): Promise<boolean> {
    try {
      return await this.contract.isAvailable(domainName.toLowerCase())
    } catch (error) {
      console.error('Error checking domain availability:', error)
      throw new Error('Failed to check domain availability')
    }
  }

  // Get domain owner
  async getDomainOwner(domainName: string): Promise<string> {
    try {
      return await this.contract.ownerOf(domainName.toLowerCase())
    } catch (error) {
      console.error('Error getting domain owner:', error)
      throw new Error('Failed to get domain owner')
    }
  }

  // Get domain expiration
  async getDomainExpiration(domainName: string): Promise<Date> {
    try {
      const timestamp = await this.contract.expiresAt(domainName.toLowerCase())
      return new Date(Number(timestamp) * 1000)
    } catch (error) {
      console.error('Error getting domain expiration:', error)
      throw new Error('Failed to get domain expiration')
    }
  }

  // Get domain info (omnichain)
  async getDomainInfo(domainName: string) {
    try {
      const result = await this.contract.getDomainInfo(domainName.toLowerCase())
      
      // Check if result is valid
      if (!result || result.length < 5) {
        throw new Error('Invalid contract response')
      }
      
      return {
        owner: result[0],
        expiresAt: result[1],
        sourceChainId: Number(result[2]),
        isOmnichain: result[3],
        isExpired: result[4]
      }
    } catch (error: any) {
      console.error('Error getting domain info:', error)
      
      // Handle specific error cases
      if (error?.code === 'BAD_DATA' || error?.message?.includes('could not decode result data')) {
        throw new Error('Domain not found or invalid')
      }
      
      throw new Error('Failed to get domain info')
    }
  }

  // Get supported chains
  async getSupportedChains(): Promise<number[]> {
    try {
      const chains = await this.contract.getSupportedChains()
      return chains.map((chain: bigint) => Number(chain))
    } catch (error) {
      console.error('Error getting supported chains:', error)
      return []
    }
  }

  // Register domain (with omnichain option)
  async registerDomain(domainName: string, makeOmnichain: boolean = false): Promise<string> {
    try {
      console.log('🔗 Registering omnichain domain:', domainName);
      console.log('🌐 Make omnichain:', makeOmnichain);
      console.log('💰 Payment amount:', ethers.formatEther(DOMAIN_PRICE), 'ETH');

      // Get signer
      const signer = await this.signer;
      console.log('👤 Signer address:', await (signer as any).getAddress());

      // Create contract instance with signer
      const contractWithSigner = this.contract.connect(signer as any);

      // Get chain-specific pricing
      const chainConfig = getChainConfig(this.chainId)
      const price = chainConfig ? ethers.parseEther(chainConfig.registrationPrice) : DOMAIN_PRICE

      console.log('💰 Using chain-specific price:', ethers.formatEther(price), 'ETH');
      console.log('📝 Calling register with:', domainName.toLowerCase(), makeOmnichain);
      
      const tx = await (contractWithSigner as any).register(domainName.toLowerCase(), makeOmnichain, {
        value: price,
        gasLimit: 500000, // Higher gas limit for omnichain
      });

      console.log('📤 Transaction sent:', tx.hash);
      
      // Get explorer URL based on chain
      const chainConfig2 = getChainConfig(this.chainId)
      if (chainConfig2) {
        const explorerUrl = this.chainId === 421614 
          ? process.env.NEXT_PUBLIC_ARB_SEPOLIA_EXPLORER_URL 
          : process.env.NEXT_PUBLIC_ZETACHAIN_TESTNET_EXPLORER_URL
        if (explorerUrl) {
          console.log('🔗 View on explorer:', `${explorerUrl}/tx/${tx.hash}`);
        }
      }

      // Wait for confirmation
      const receipt = await tx.wait(1);
      
      if (receipt.status === 1) {
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        return tx.hash;
      } else {
        throw new Error('Transaction failed on blockchain');
      }
    } catch (error: any) {
      console.error('❌ Error registering domain:', error);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('Transaction was rejected by user');
      }

      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds to register domain (need 0.001 ETH + gas)');
      }

      if (error.message?.includes('execution reverted')) {
        throw new Error('Domain registration failed: ' + (error.reason || 'Unknown error'));
      }

      if (error.message?.includes('TAKEN')) {
        throw new Error('Domain is already registered');
      }

      throw new Error('Failed to register domain: ' + error.message);
    }
  }

  // Transfer domain (same chain)
  async transferDomain(domainName: string, toAddress: string): Promise<string> {
    try {
      console.log('🔄 Transferring domain:', domainName, 'to:', toAddress);
      
      const signer = await this.signer;
      const contractWithSigner = this.contract.connect(signer as any);
      
      // Get chain-specific transfer fee
      const chainConfig = getChainConfig(this.chainId)
      const fee = chainConfig ? ethers.parseEther(chainConfig.transferFee) : TRANSFER_FEE
      
      const tx = await (contractWithSigner as any).transfer(domainName.toLowerCase(), toAddress, { 
        value: fee,
        gasLimit: 300000
      })
      
      console.log('📤 Transfer transaction sent:', tx.hash);
      await tx.wait()
      console.log('✅ Transfer confirmed');
      
      return tx.hash
    } catch (error: any) {
      console.error('Error transferring domain:', error)

      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user')
      }

      throw new Error('Failed to transfer domain: ' + error.message)
    }
  }

  // Cross-chain transfer
  async crossChainTransfer(domainName: string, toAddress: string, targetChainId: number): Promise<string> {
    try {
      console.log('🌐 Cross-chain transfer:', domainName, 'to chain:', targetChainId);
      
      const signer = await this.signer;
      const contractWithSigner = this.contract.connect(signer as any);
      
      // Get chain-specific transfer fee
      const chainConfig = getChainConfig(this.chainId)
      const fee = chainConfig ? ethers.parseEther(chainConfig.transferFee) : TRANSFER_FEE
      
      const tx = await (contractWithSigner as any).crossChainTransfer(
        domainName.toLowerCase(), 
        toAddress, 
        targetChainId, 
        { 
          value: fee,
          gasLimit: 800000 // Higher gas for cross-chain
        }
      )
      
      console.log('📤 Cross-chain transfer transaction sent:', tx.hash);
      await tx.wait()
      console.log('✅ Cross-chain transfer initiated');
      
      return tx.hash
    } catch (error: any) {
      console.error('Error in cross-chain transfer:', error)

      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user')
      }

      throw new Error('Failed to initiate cross-chain transfer: ' + error.message)
    }
  }

  // Transfer domain with signature (for cross-wallet transfers)
  // Removed transfer with signature for minimal contract

  // Renew domain
  async renewDomain(domainName: string): Promise<string> {
    try {
      const signer = await this.signer;
      const tx = await (this.contract.connect(signer as any) as any).renew(domainName.toLowerCase(), {
        value: DOMAIN_PRICE,
      })

      await tx.wait()
      return tx.hash
    } catch (error: any) {
      console.error('Error renewing domain:', error)

      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user')
      }

      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds to renew domain')
      }

      throw new Error('Failed to renew domain')
    }
  }

  // Get domain price
  async getDomainPrice(): Promise<string> {
    try {
      const price = await this.contract.REGISTRATION_PRICE()
      return ethers.formatEther(price)
    } catch (error) {
      console.error('Error getting domain price:', error)
      return '1000' // Fallback price
    }
  }

  // Create signature for domain transfer
  async createTransferSignature(domainName: string, toAddress: string): Promise<string> {
    try {
      console.log('🔗 Creating transfer signature for:', domainName, 'to:', toAddress);

      // Get signer if needed
      const signer = await this.signer;

      // Create message hash
      const message = ethers.solidityPackedKeccak256(
        ['string', 'address'],
        [domainName.toLowerCase(), toAddress]
      );

      console.log('📝 Message hash:', message);
      console.log('✍️ Requesting signature from wallet...');

      // Sign the message
      const signature = await (signer as any).signMessage(ethers.getBytes(message));

      console.log('✅ Signature created:', signature);
      return signature;
    } catch (error: any) {
      console.error('❌ Error creating transfer signature:', error);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('Signature was rejected by user');
      }

      throw new Error('Failed to create transfer signature: ' + error.message);
    }
  }
}

// Utility function to get omnichain contract instance
export const getOmnichainContract = (provider: unknown, chainId?: number): OmnichainZetaNameServiceContract => {
  try {
    // For modern providers (MetaMask, etc.)
    if ((provider as any).request) {
      const ethersProvider = new ethers.BrowserProvider(provider as any)
      return new OmnichainZetaNameServiceContract(ethersProvider, chainId)
    }
    // Fallback for other providers
    return new OmnichainZetaNameServiceContract(provider, chainId)
  } catch (error) {
    console.error('Error creating omnichain contract instance:', error)
    throw new Error('Failed to create omnichain contract instance')
  }
}

// Legacy function for backward compatibility
export const getCreditContract = (provider: unknown): OmnichainZetaNameServiceContract => {
  return getOmnichainContract(provider)
}