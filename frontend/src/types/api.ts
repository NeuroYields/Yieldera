// API Response Types based on backend response
export interface BackendVaultResponse {
  address: string;
  pool: {
    address: string;
    token0: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      is_native_wrapper: boolean;
    };
    token1: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      is_native_wrapper: boolean;
    };
    fee: number;
    tick_spacing: number;
    current_tick: number;
    sqrt_price_x96: string;
    price1: number;
    price0: number;
  };
  name: string;
  symbol: string;
  decimals: number;
  total_supply: number;
  lower_tick: number;
  upper_tick: number;
  is_active: boolean;
}

// Frontend Vault Types (transformed from backend response)
export interface VaultData {
  id: string;
  name: string;
  symbol: string;
  address: string;
  pool: {
    address: string;
    token0: {
      symbol: string;
      name: string;
      address: string;
      decimals: number;
      isNativeWrapper: boolean;
      image: string;
    };
    token1: {
      symbol: string;
      name: string;
      address: string;
      decimals: number;
      isNativeWrapper: boolean;
      image: string;
    };
    fee: number;
    tickSpacing: number;
    currentTick: number;
    sqrtPriceX96: string;
    price1: number;
    price0: number;
  };
  totalSupply: number;
  lowerTick: number;
  upperTick: number;
  isActive: boolean;
  // Mock data for now - these will be calculated later
  tvl: string;
  apy: string;
  status: "SaucerSwap" | "Bonzo" | "Etaswap";
}

// Token icon mapping
export const TOKEN_ICONS: Record<string, string> = {
  HBAR: "/images/whbar.png",
  WHBAR: "/images/whbar.png",
  SAUCE: "/images/tokens/sauce.webp",
  USDC: "/images/tokens/usdc.png",
};

// DEX status mapping based on pool data or other criteria
export const DEX_STATUS_MAP: Record<
  string,
  "SaucerSwap" | "Bonzo" | "Etaswap"
> = {
  // This can be determined by pool address or other criteria
  // For now, we'll use a simple mapping
  default: "SaucerSwap",
};
