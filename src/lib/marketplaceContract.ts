import { ethers } from 'ethers'
import { getContractAddresses } from '../config/chains'

const OMNICHAIN_MARKETPLACE_ABI = [
  // Read functions
  'function getListingFee(uint256 chainId) external view returns (uint256)',
  'function listings(string calldata name) external view returns (tuple(address seller, uint256 price, uint256 chainId, bool active, bool allowCrossChain, uint256 listedAt))',
  'function isListingActive(string calldata name) external view returns (bool)',
  'function getListingInfo(string calldata name) external view returns (address seller, uint256 price, uint256 chainId, bool allowCrossChain, uint256 listedAt)',
  'function getOffer(string calldata name, address buyer) external view returns (tuple(address buyer, uint256 offerPrice, uint256 sourceChainId, uint256 targetChainId, uint256 expiresAt, bool active))',
  'function getSupportedChains() external view returns (uint256[] memory)',
  
  // Write functions
  'function list(string calldata name, uint256 price, bool allowCrossChain) external payable',
  'function unlist(string calldata name) external',
  'function buy(string calldata name) external payable',
  'function makeCrossChainOffer(string calldata name, uint256 targetChainId) external payable',
  'function acceptCrossChainOffer(string calldata name, address buyer) external',
  'function cancelOffer(string calldata name) external'
]

// Get marketplace address based on current chain
const getMarketplaceAddress = (chainId: number): string => {
  const addresses = getContractAddresses(chainId)
  return addresses?.marketplace || ''
}

export class OmnichainZetaMarketplaceContract {
  private contract!: ethers.Contract
  private signer: any
  private chainId!: number

  constructor(provider: any, chainId?: number) {
    // Get chain ID from provider if not provided
    if (!chainId) {
      if (provider.getNetwork) {
        provider.getNetwork().then((network: any) => {
          this.chainId = Number(network.chainId)
          this.initializeContract(provider)
        })
      } else {
        this.chainId = 421614 // Default to Arbitrum Sepolia
        this.initializeContract(provider)
      }
    } else {
      this.chainId = chainId
      this.initializeContract(provider)
    }
  }

  private initializeContract(provider: any) {
    const marketplaceAddress = getMarketplaceAddress(this.chainId)
    if (!marketplaceAddress || marketplaceAddress.trim() === '') {
      throw new Error(`Marketplace contract address not set for chain ${this.chainId}`)
    }
    
    const ethersProvider = provider.request ? new ethers.BrowserProvider(provider) : provider
    this.signer = ethersProvider.getSigner ? ethersProvider.getSigner() : ethersProvider
    this.contract = new ethers.Contract(marketplaceAddress, OMNICHAIN_MARKETPLACE_ABI, ethersProvider)
    
    console.log('🏪 Omnichain marketplace initialized:', marketplaceAddress);
    console.log('🌐 Chain ID:', this.chainId);
  }

  async buy(name: string, valueWei: bigint): Promise<string> {
    const signer = await this.signer
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('buy', [name.toLowerCase()])
    const tx = await signer.sendTransaction({ to, data, value: valueWei, gasLimit: BigInt(300000) })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Purchase failed on-chain')
    return tx.hash
  }

  async list(name: string, priceWei: bigint, allowCrossChain: boolean = false): Promise<string> {
    const signer = await this.signer
    const listingFee: bigint = await this.contract.getListingFee(this.chainId)
    console.log(`Listing fee required: ${ethers.formatEther(listingFee)} ETH`)
    
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('list', [name.toLowerCase(), priceWei, allowCrossChain])
    
    console.log(`Listing domain: ${name.toLowerCase()}`)
    console.log(`Price: ${ethers.formatEther(priceWei)} ETH`)
    console.log(`Fee: ${ethers.formatEther(listingFee)} ETH`)
    console.log(`Allow cross-chain: ${allowCrossChain}`)
    
    const tx = await signer.sendTransaction({ to, data, value: listingFee, gasLimit: BigInt(400000) })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Listing failed on-chain')
    return tx.hash
  }

  async makeCrossChainOffer(name: string, targetChainId: number, offerPriceWei: bigint): Promise<string> {
    const signer = await this.signer
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('makeCrossChainOffer', [name.toLowerCase(), targetChainId])
    
    console.log(`Making cross-chain offer for: ${name.toLowerCase()}`)
    console.log(`Target chain: ${targetChainId}`)
    console.log(`Offer price: ${ethers.formatEther(offerPriceWei)} ETH`)
    
    const tx = await signer.sendTransaction({ to, data, value: offerPriceWei, gasLimit: BigInt(400000) })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Cross-chain offer failed on-chain')
    return tx.hash
  }

  async acceptCrossChainOffer(name: string, buyer: string): Promise<string> {
    const signer = await this.signer
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('acceptCrossChainOffer', [name.toLowerCase(), buyer])
    
    console.log(`Accepting cross-chain offer for: ${name.toLowerCase()}`)
    console.log(`Buyer: ${buyer}`)
    
    const tx = await signer.sendTransaction({ to, data, gasLimit: BigInt(500000) })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Accept cross-chain offer failed on-chain')
    return tx.hash
  }

  async getListingInfo(name: string) {
    const result = await this.contract.getListingInfo(name.toLowerCase())
    return {
      seller: result[0],
      price: result[1],
      chainId: Number(result[2]),
      allowCrossChain: result[3],
      listedAt: result[4]
    }
  }

  async getOffer(name: string, buyer: string) {
    const result = await this.contract.getOffer(name.toLowerCase(), buyer)
    return {
      buyer: result[0],
      offerPrice: result[1],
      sourceChainId: Number(result[2]),
      targetChainId: Number(result[3]),
      expiresAt: result[4],
      active: result[5]
    }
  }

  async unlist(name: string): Promise<string> {
    const signer = await this.signer
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('unlist', [name.toLowerCase()])
    const tx = await signer.sendTransaction({ to, data, gasLimit: BigInt(200000) })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Unlist failed on-chain')
    return tx.hash
  }
}

export const getOmnichainMarketplaceContract = (provider: any, chainId?: number) => new OmnichainZetaMarketplaceContract(provider, chainId)

// Legacy function for backward compatibility
export const getMarketplaceContract = (provider: any) => getOmnichainMarketplaceContract(provider)



