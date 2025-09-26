import { ethers } from 'ethers'
import { getContractAddresses, getChainConfig, getCrossChainRoute } from '../config/chains'

// ABI for ZetaOmnichainNameService
const OMNICHAIN_NAME_SERVICE_ABI = [
  // Read functions
  'function isAvailable(string calldata name) external view returns (bool)',
  'function ownerOf(string calldata name) external view returns (address)',
  'function expiresAt(string calldata name) external view returns (uint64)',
  'function getDomainInfo(string calldata name) external view returns (address owner, uint64 expiresAt, uint256 sourceChainId, bool isOmnichain, bool isExpired)',
  'function getSupportedChains() external view returns (uint256[] memory)',
  'function getChainConfig(uint256 chainId) external view returns (tuple(bool isSupported, uint256 registrationPrice, uint256 transferFee, string rpcUrl, string explorerUrl))',
  
  // Write functions
  'function register(string calldata name, bool makeOmnichain) external payable',
  'function renew(string calldata name) external payable',
  'function transfer(string calldata name, address to) external payable',
  'function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable',
  
  // Events
  'event Registered(string indexed name, address indexed owner, uint256 expiresAt, uint256 chainId, bool isOmnichain)',
  'event Transferred(string indexed name, address indexed from, address indexed to, uint256 sourceChainId, uint256 targetChainId)',
  'event CrossChainTransfer(string indexed name, address indexed from, address indexed to, uint256 sourceChainId, uint256 targetChainId, bytes32 messageId)',
]

// ABI for ZetaOmnichainMarketplace
const OMNICHAIN_MARKETPLACE_ABI = [
  // Read functions
  'function listings(string calldata name) external view returns (tuple(address seller, uint256 price, uint256 chainId, bool active, bool allowCrossChain, uint256 listedAt))',
  'function crossChainOffers(string calldata name, address buyer) external view returns (tuple(address buyer, uint256 offerPrice, uint256 sourceChainId, uint256 targetChainId, uint256 expiresAt, bool active))',
  'function isListingActive(string calldata name) external view returns (bool)',
  'function getListingInfo(string calldata name) external view returns (address seller, uint256 price, uint256 chainId, bool allowCrossChain, uint256 listedAt)',
  'function getOffer(string calldata name, address buyer) external view returns (tuple(address buyer, uint256 offerPrice, uint256 sourceChainId, uint256 targetChainId, uint256 expiresAt, bool active))',
  'function getSupportedChains() external view returns (uint256[] memory)',
  'function getListingFee(uint256 chainId) external view returns (uint256)',
  
  // Write functions
  'function list(string calldata name, uint256 price, bool allowCrossChain) external payable',
  'function unlist(string calldata name) external',
  'function buy(string calldata name) external payable',
  'function makeCrossChainOffer(string calldata name, uint256 targetChainId) external payable',
  'function acceptCrossChainOffer(string calldata name, address buyer) external',
  'function cancelOffer(string calldata name) external',
  
  // Events
  'event Listed(string indexed name, address indexed seller, uint256 price, uint256 chainId, bool allowCrossChain)',
  'event Purchased(string indexed name, address indexed seller, address indexed buyer, uint256 price, uint256 chainId)',
  'event CrossChainPurchased(string indexed name, address indexed seller, address indexed buyer, uint256 price, uint256 sourceChainId, uint256 targetChainId)',
  'event OfferMade(string indexed name, address indexed buyer, uint256 offerPrice, uint256 sourceChainId, uint256 targetChainId)',
]

export class OmnichainNameService {
  private contract: ethers.Contract
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private chainId: number

  constructor(provider: ethers.Provider, chainId: number, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.chainId = chainId
    
    const addresses = getContractAddresses(chainId)
    if (!addresses?.nameService) {
      throw new Error(`Name service contract not deployed on chain ${chainId}`)
    }
    
    this.contract = new ethers.Contract(
      addresses.nameService,
      OMNICHAIN_NAME_SERVICE_ABI,
      signer || provider
    )
  }

  // Read functions
  async isAvailable(name: string): Promise<boolean> {
    return await this.contract.isAvailable(name.toLowerCase())
  }

  async ownerOf(name: string): Promise<string> {
    return await this.contract.ownerOf(name.toLowerCase())
  }

  async expiresAt(name: string): Promise<bigint> {
    return await this.contract.expiresAt(name.toLowerCase())
  }

  async getDomainInfo(name: string) {
    const result = await this.contract.getDomainInfo(name.toLowerCase())
    return {
      owner: result[0],
      expiresAt: result[1],
      sourceChainId: Number(result[2]),
      isOmnichain: result[3],
      isExpired: result[4]
    }
  }

  async getSupportedChains(): Promise<number[]> {
    const chains = await this.contract.getSupportedChains()
    return chains.map((chain: bigint) => Number(chain))
  }

  async getChainConfig(chainId: number) {
    const config = await this.contract.getChainConfig(chainId)
    return {
      isSupported: config[0],
      registrationPrice: config[1],
      transferFee: config[2],
      rpcUrl: config[3],
      explorerUrl: config[4]
    }
  }

  // Write functions
  async register(name: string, makeOmnichain: boolean = false): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for registration')
    
    const chainConfig = getChainConfig(this.chainId)
    if (!chainConfig) throw new Error(`Chain ${this.chainId} not supported`)
    
    const price = ethers.parseEther(chainConfig.registrationPrice)
    
    return await this.contract.register(name.toLowerCase(), makeOmnichain, {
      value: price
    })
  }

  async renew(name: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for renewal')
    
    const chainConfig = getChainConfig(this.chainId)
    if (!chainConfig) throw new Error(`Chain ${this.chainId} not supported`)
    
    const price = ethers.parseEther(chainConfig.registrationPrice)
    
    return await this.contract.renew(name.toLowerCase(), {
      value: price
    })
  }

  async transfer(name: string, to: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for transfer')
    
    const chainConfig = getChainConfig(this.chainId)
    if (!chainConfig) throw new Error(`Chain ${this.chainId} not supported`)
    
    const fee = ethers.parseEther(chainConfig.transferFee)
    
    return await this.contract.transfer(name.toLowerCase(), to, {
      value: fee
    })
  }

  async crossChainTransfer(
    name: string, 
    to: string, 
    targetChainId: number
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for cross-chain transfer')
    
    const chainConfig = getChainConfig(this.chainId)
    if (!chainConfig) throw new Error(`Chain ${this.chainId} not supported`)
    
    const route = getCrossChainRoute(this.chainId, targetChainId)
    if (!route) throw new Error(`Cross-chain route not supported: ${this.chainId} -> ${targetChainId}`)
    
    const fee = ethers.parseEther(chainConfig.transferFee)
    
    return await this.contract.crossChainTransfer(name.toLowerCase(), to, targetChainId, {
      value: fee
    })
  }

  // Event listeners
  onRegistered(callback: (name: string, owner: string, expiresAt: bigint, chainId: number, isOmnichain: boolean) => void) {
    this.contract.on('Registered', callback)
  }

  onTransferred(callback: (name: string, from: string, to: string, sourceChainId: number, targetChainId: number) => void) {
    this.contract.on('Transferred', callback)
  }

  onCrossChainTransfer(callback: (name: string, from: string, to: string, sourceChainId: number, targetChainId: number, messageId: string) => void) {
    this.contract.on('CrossChainTransfer', callback)
  }

  // Utility functions
  async estimateRegistrationGas(name: string, makeOmnichain: boolean = false): Promise<bigint> {
    if (!this.signer) throw new Error('Signer required for gas estimation')
    
    const chainConfig = getChainConfig(this.chainId)
    if (!chainConfig) throw new Error(`Chain ${this.chainId} not supported`)
    
    const price = ethers.parseEther(chainConfig.registrationPrice)
    
    return await this.contract.register.estimateGas(name.toLowerCase(), makeOmnichain, {
      value: price
    })
  }

  async estimateCrossChainTransferGas(name: string, to: string, targetChainId: number): Promise<bigint> {
    if (!this.signer) throw new Error('Signer required for gas estimation')
    
    const chainConfig = getChainConfig(this.chainId)
    if (!chainConfig) throw new Error(`Chain ${this.chainId} not supported`)
    
    const fee = ethers.parseEther(chainConfig.transferFee)
    
    return await this.contract.crossChainTransfer.estimateGas(name.toLowerCase(), to, targetChainId, {
      value: fee
    })
  }
}

export class OmnichainMarketplace {
  private contract: ethers.Contract
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private chainId: number

  constructor(provider: ethers.Provider, chainId: number, signer?: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.chainId = chainId
    
    const addresses = getContractAddresses(chainId)
    if (!addresses?.marketplace) {
      throw new Error(`Marketplace contract not deployed on chain ${chainId}`)
    }
    
    this.contract = new ethers.Contract(
      addresses.marketplace,
      OMNICHAIN_MARKETPLACE_ABI,
      signer || provider
    )
  }

  // Read functions
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

  async isListingActive(name: string): Promise<boolean> {
    return await this.contract.isListingActive(name.toLowerCase())
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

  async getListingFee(chainId: number): Promise<bigint> {
    return await this.contract.getListingFee(chainId)
  }

  // Write functions
  async list(name: string, price: string, allowCrossChain: boolean = false): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for listing')
    
    const listingFee = await this.getListingFee(this.chainId)
    const priceWei = ethers.parseEther(price)
    
    return await this.contract.list(name.toLowerCase(), priceWei, allowCrossChain, {
      value: listingFee
    })
  }

  async unlist(name: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for unlisting')
    
    return await this.contract.unlist(name.toLowerCase())
  }

  async buy(name: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for purchase')
    
    const listingInfo = await this.getListingInfo(name)
    
    return await this.contract.buy(name.toLowerCase(), {
      value: listingInfo.price
    })
  }

  async makeCrossChainOffer(
    name: string, 
    targetChainId: number, 
    offerPrice: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for making offer')
    
    const offerWei = ethers.parseEther(offerPrice)
    
    return await this.contract.makeCrossChainOffer(name.toLowerCase(), targetChainId, {
      value: offerWei
    })
  }

  async acceptCrossChainOffer(name: string, buyer: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for accepting offer')
    
    return await this.contract.acceptCrossChainOffer(name.toLowerCase(), buyer)
  }

  async cancelOffer(name: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.signer) throw new Error('Signer required for canceling offer')
    
    return await this.contract.cancelOffer(name.toLowerCase())
  }

  // Event listeners
  onListed(callback: (name: string, seller: string, price: bigint, chainId: number, allowCrossChain: boolean) => void) {
    this.contract.on('Listed', callback)
  }

  onPurchased(callback: (name: string, seller: string, buyer: string, price: bigint, chainId: number) => void) {
    this.contract.on('Purchased', callback)
  }

  onCrossChainPurchased(callback: (name: string, seller: string, buyer: string, price: bigint, sourceChainId: number, targetChainId: number) => void) {
    this.contract.on('CrossChainPurchased', callback)
  }

  onOfferMade(callback: (name: string, buyer: string, offerPrice: bigint, sourceChainId: number, targetChainId: number) => void) {
    this.contract.on('OfferMade', callback)
  }
}

// Factory functions
export const createOmnichainNameService = (provider: ethers.Provider, chainId: number, signer?: ethers.Signer) => {
  return new OmnichainNameService(provider, chainId, signer)
}

export const createOmnichainMarketplace = (provider: ethers.Provider, chainId: number, signer?: ethers.Signer) => {
  return new OmnichainMarketplace(provider, chainId, signer)
}