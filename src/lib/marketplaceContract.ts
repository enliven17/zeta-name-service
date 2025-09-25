import { ethers } from 'ethers'

const MARKETPLACE_ABI = [
  'function LISTING_FEE() view returns (uint256)',
  'function list(string name, uint256 price) payable',
  'function unlist(string name)',
  'function buy(string name) payable',
  'function listings(string name) view returns (address seller, uint256 price, bool active)'
]

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || ''

export class ZetaNameMarketplaceContract {
  private contract: ethers.Contract
  private signer: any

  constructor(provider: any) {
    if (!MARKETPLACE_ADDRESS || MARKETPLACE_ADDRESS.trim() === '') {
      throw new Error('Marketplace contract address is not set. Define NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS')
    }
    const ethersProvider = provider.request ? new ethers.BrowserProvider(provider) : provider
    this.signer = ethersProvider.getSigner ? ethersProvider.getSigner() : ethersProvider
    this.contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, ethersProvider)
  }

  async buy(name: string, valueWei: bigint): Promise<string> {
    const signer = await this.signer
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('buy', [name.toLowerCase()])
    const tx = await signer.sendTransaction({ to, data, value: valueWei, gasLimit: 300000n })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Purchase failed on-chain')
    return tx.hash
  }

  async list(name: string, priceWei: bigint): Promise<string> {
    const signer = await this.signer
    const listingFee: bigint = await this.contract.LISTING_FEE()
    console.log(`Listing fee required: ${ethers.formatEther(listingFee)} ETH`)
    
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('list', [name.toLowerCase(), priceWei])
    
    console.log(`Listing domain: ${name.toLowerCase()}`)
    console.log(`Price: ${ethers.formatEther(priceWei)} ETH`)
    console.log(`Fee: ${ethers.formatEther(listingFee)} ETH`)
    
    const tx = await signer.sendTransaction({ to, data, value: listingFee, gasLimit: 300000n })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Listing failed on-chain')
    return tx.hash
  }

  async unlist(name: string): Promise<string> {
    const signer = await this.signer
    const to = await this.contract.getAddress()
    const data = this.contract.interface.encodeFunctionData('unlist', [name.toLowerCase()])
    const tx = await signer.sendTransaction({ to, data, gasLimit: 200000n })
    const receipt = await tx.wait(1)
    if (receipt.status !== 1) throw new Error('Unlist failed on-chain')
    return tx.hash
  }
}

export const getMarketplaceContract = (provider: any) => new ZetaNameMarketplaceContract(provider)



