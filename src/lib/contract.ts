import { ethers } from 'ethers'

// Zeta Name Service ABI
const ZETA_NAME_SERVICE_ABI = [
  "function register(string) payable",
  "function isAvailable(string) view returns (bool)",
  "function ownerOf(string) view returns (address)",
  "function transfer(string, address)",
  "function renew(string) payable",
  "function REGISTRATION_PRICE() view returns (uint256)",
  "function expiresAt(string) view returns (uint64)",
]

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

console.log('🔗 Using Zeta contract address:', CONTRACT_ADDRESS);
const DOMAIN_PRICE = ethers.parseEther('0.001') // 0.001 ETH
const TRANSFER_FEE = ethers.parseEther('0.0001')  // 0.0001 ETH

export class ZetaNameServiceContract {
  private contract: ethers.Contract
  private signer: unknown
  private provider: unknown

  constructor(provider: unknown) {
    this.provider = provider
    this.signer = provider.getSigner ? provider.getSigner() : provider
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, ZETA_NAME_SERVICE_ABI, provider)

    console.log('🔗 Contract initialized:', CONTRACT_ADDRESS);
    console.log('🔗 Provider:', provider);
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

  // Register domain
  async registerDomain(domainName: string): Promise<string> {
    try {
      console.log('🔗 Registering domain on-chain:', domainName);
      console.log('💰 Payment amount:', ethers.formatEther(DOMAIN_PRICE), 'ETH');

      // Get signer
      const signer = await this.signer;
      console.log('👤 Signer address:', await signer.getAddress());

      // Create contract instance with signer
      const contractWithSigner = this.contract.connect(signer);

      // Skip contract price check for now - proceed directly to registration
      console.log('💰 Using fixed domain price: 0.001 ETH');

      // Try a direct contract call without complex error handling
      console.log('📝 Attempting direct registerDomain call...');

      // Gas limits tuned for Credit testnet
      console.log('📝 Calling register with:', domainName.toLowerCase());
      const tx = await contractWithSigner.register(domainName.toLowerCase(), {
        value: DOMAIN_PRICE,
        gasLimit: 300000,
      });

      console.log('📤 Transaction sent:', tx.hash);
      if (process.env.NEXT_PUBLIC_CREDIT_EXPLORER_URL) {
        console.log('🔗 View on explorer:', process.env.NEXT_PUBLIC_CREDIT_EXPLORER_URL + '/tx/' + tx.hash);
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

  // Transfer domain
  async transferDomain(domainName: string, toAddress: string): Promise<string> {
    try {
      const signer = await this.signer;
      const tx = await this.contract.connect(signer).transfer(domainName.toLowerCase(), toAddress, { value: TRANSFER_FEE })
      await tx.wait()
      return tx.hash
    } catch (error: any) {
      console.error('Error transferring domain:', error)

      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction was rejected by user')
      }

      throw new Error('Failed to transfer domain')
    }
  }

  // Transfer domain with signature (for cross-wallet transfers)
  // Removed transfer with signature for minimal contract

  // Renew domain
  async renewDomain(domainName: string): Promise<string> {
    try {
      const signer = await this.signer;
      const tx = await this.contract.connect(signer).renew(domainName.toLowerCase(), {
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
      const signature = await signer.signMessage(ethers.getBytes(message));

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

// Utility function to get contract instance
export const getCreditContract = (provider: unknown): ZetaNameServiceContract => {
  try {
    // For modern providers (MetaMask, etc.)
    if (provider.request) {
      const ethersProvider = new ethers.BrowserProvider(provider)
      return new ZetaNameServiceContract(ethersProvider)
    }
    // Fallback for other providers
    return new ZetaNameServiceContract(provider)
  } catch (error) {
    console.error('Error creating contract instance:', error)
    throw new Error('Failed to create contract instance')
  }
}