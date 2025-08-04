import {
  BackendVaultResponse,
  VaultData,
  TOKEN_ICONS,
  DEX_STATUS_MAP,
} from "../types/api";

// Mock TVL and APY data - these will be replaced with real calculations later
const mockTvlData = ["$2.4M", "$1.8M", "$3.1M", "$1.2M", "$4.5M"];
const mockApyData = ["24.5%", "31.2%", "18.7%", "42.1%", "15.9%"];

/**
 * Transform backend vault response to frontend vault data
 */
export const transformVaultData = (
  backendVault: BackendVaultResponse,
  index: number = 0
): VaultData => {
  // Handle WHBAR as HBAR for display
  const getDisplayToken = (token: BackendVaultResponse["pool"]["token0"]) => ({
    symbol: token.is_native_wrapper ? "HBAR" : token.symbol,
    name: token.is_native_wrapper ? "Hedera Hashgraph" : token.name,
    address: token.address,
    decimals: token.decimals,
    isNativeWrapper: token.is_native_wrapper,
    image:
      TOKEN_ICONS[token.is_native_wrapper ? "HBAR" : token.symbol] ||
      `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMzOWZmMTQiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMGQwZDBkIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIj4/PC90ZXh0Pgo8L3N2Zz4K`,
  });

  // Determine DEX status based on tokens or other criteria
  const getDexStatus = (
    vault: BackendVaultResponse
  ): "SaucerSwap" | "Bonzo" | "Etaswap" => {
    // Simple logic for now - can be enhanced based on actual criteria
    const token0Symbol = vault.pool.token0.is_native_wrapper
      ? "HBAR"
      : vault.pool.token0.symbol;
    const token1Symbol = vault.pool.token1.is_native_wrapper
      ? "HBAR"
      : vault.pool.token1.symbol;

    if (token0Symbol === "SAUCE" || token1Symbol === "SAUCE") {
      return "Bonzo";
    } else if (token0Symbol === "HBAR" || token1Symbol === "HBAR") {
      return "SaucerSwap";
    } else {
      return "Etaswap";
    }
  };

  const token0 = getDisplayToken(backendVault.pool.token0);
  const token1 = getDisplayToken(backendVault.pool.token1);

  return {
    id: `vault_${backendVault.address}`,
    name: backendVault.name,
    symbol: backendVault.symbol,
    address: backendVault.address,
    pool: {
      address: backendVault.pool.address,
      token0,
      token1,
      fee: backendVault.pool.fee,
      tickSpacing: backendVault.pool.tick_spacing,
      currentTick: backendVault.pool.current_tick,
      sqrtPriceX96: backendVault.pool.sqrt_price_x96,
      price1: backendVault.pool.price1,
      price0: backendVault.pool.price0,
    },
    totalSupply: backendVault.total_supply,
    lowerTick: backendVault.lower_tick,
    upperTick: backendVault.upper_tick,
    isActive: backendVault.is_active,
    // Mock data for now
    tvl: mockTvlData[index % mockTvlData.length],
    apy: mockApyData[index % mockApyData.length],
    status: getDexStatus(backendVault),
  };
};

/**
 * Format large numbers for display
 */
export const formatTvl = (amount: number): string => {
  if (amount >= 1e9) {
    return `$${(amount / 1e9).toFixed(1)}B`;
  } else if (amount >= 1e6) {
    return `$${(amount / 1e6).toFixed(1)}M`;
  } else if (amount >= 1e3) {
    return `$${(amount / 1e3).toFixed(1)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Format APY percentage
 */
export const formatApy = (apy: number): string => {
  return `${apy.toFixed(1)}%`;
};
