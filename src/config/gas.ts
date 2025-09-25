/**
 * Gas configuration (updated for Credit testnet)
 * Optimized for cost efficiency while maintaining reliability
 */

export const GAS_CONFIG = {
  // Gas limits for different operations (in wei)
  DOMAIN_REGISTRATION: 300000,    // Domain registration - reduced
  DOMAIN_RENEWAL: 200000,         // Domain renewal - reduced
  DOMAIN_TRANSFER: 150000,        // Domain transfer - reduced
  DOMAIN_QUERY: 100000,           // Read operations
  
  // Gas price settings (in gwei)
  MAX_GAS_PRICE: 1,               // Maximum 1 gwei - very low
  PRIORITY_FEE_MULTIPLIER: 1.0,   // No multiplier - use network default
  
  // Transaction timeouts (in milliseconds)
  CONFIRMATION_TIMEOUT: 600000,   // 10 minutes
  ESTIMATION_TIMEOUT: 30000,      // 30 seconds
  
  // Network-specific settings (placeholder; use envs in runtime where needed)
  UMI_NETWORK: {
    CHAIN_ID: 0,
    RPC_URL: '',
    EXPLORER_URL: ''
  }
} as const;

/**
 * Get optimized gas settings for a transaction
 * @param operation - The type of operation
 * @param feeData - Current network fee data
 * @returns Optimized transaction options
 */
export function getOptimizedGasSettings(
  operation: keyof typeof GAS_CONFIG,
  feeData: {
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }
) {
  const gasLimit = GAS_CONFIG[operation];
  const maxGasPriceGwei = GAS_CONFIG.MAX_GAS_PRICE;
  const maxGasPriceWei = BigInt(maxGasPriceGwei) * BigInt(10 ** 9); // Convert to wei
  
  const txOptions: any = {
    gasLimit: gasLimit
  };

  // Use fixed low gas price for testnet
  const fixedGasPrice = BigInt(1) * BigInt(10 ** 9); // 1 gwei
  txOptions.gasPrice = fixedGasPrice;
  txOptions.type = 0; // Legacy transaction for simplicity
  
  console.log('⛽ Using fixed low gas price: 1 gwei');
  return txOptions;
}

/**
 * Format gas price for display
 * @param gasPrice - Gas price in wei
 * @returns Formatted gas price string
 */
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 10 ** 9;
  return `${gwei.toFixed(2)} gwei`;
}

/**
 * Check if gas price is reasonable
 * @param gasPrice - Gas price in wei
 * @returns True if gas price is reasonable
 */
export function isReasonableGasPrice(gasPrice: bigint): boolean {
  const maxGasPriceWei = BigInt(GAS_CONFIG.MAX_GAS_PRICE) * BigInt(10 ** 9);
  return gasPrice <= maxGasPriceWei;
}
