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
  // TVL data might be provided in different structures
  tvl0?: number;
  tvl1?: number;
  tvl?:
    | {
        tvl0: number;
        tvl1: number;
      }
    | string;
  // Position data from backend
  position?: {
    tick_lower: number;
    tick_upper: number;
    liquidity: number;
    amount0: number;
    amount1: number;
    fees0: number;
    fees1: number;
  };
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
  // TVL data structure to match backend response
  tvl:
    | string
    | {
        tvl0: number;
        tvl1: number;
      };
  apy: string;
  status: "SaucerSwap" | "Bonzo" | "Etaswap";
  // Optional position data that might come from backend
  position?: {
    liquidity: number;
    fees0: number;
    fees1: number;
    amount0?: number;
    amount1?: number;
  };
}

// Token icon mapping
export const TOKEN_ICONS: Record<string, string> = {
  HBAR: "/images/whbar.png",
  WHBAR: "/images/whbar.png",
  SAUCE: "/images/tokens/sauce.webp",
  USDC: "/images/tokens/usdc.png",
  DAI: "/images/tokens/dai.svg",
  USDT: "/images/tokens/usdt.png",
};
