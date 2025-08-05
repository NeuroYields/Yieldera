import { BackendVaultResponse, VaultData, TOKEN_ICONS } from "../types/api";

// Mock TVL and APY data - these will be replaced with real calculations later
const mockTvlData = ["$2.4M", "$1.8M", "$3.1M", "$1.2M", "$4.5M"];
const mockApyData = ["24.5%", "31.2%", "18.7%", "42.1%", "15.9%"];

/**
 * Transform backend vault response to frontend vault data
 */
export const transformVaultData = (
  backendVault: BackendVaultResponse | any, // Use any temporarily to handle dynamic backend response
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

  const token0 = getDisplayToken(backendVault.pool.token0);
  const token1 = getDisplayToken(backendVault.pool.token1);

  // Handle TVL data - check multiple possible structures from backend
  console.log("=== TVL TRANSFORMATION DEBUG ===");
  console.log("backendVault structure:", backendVault);
  console.log("backendVault.tvl:", backendVault.tvl);
  console.log("backendVault.total_supply:", backendVault.total_supply);
  console.log("backendVault.position:", backendVault.position);

  let tvlData;

  // Check if TVL data is in the tvl object (as shown in the backend response)
  if (
    backendVault.tvl &&
    typeof backendVault.tvl === "object" &&
    backendVault.tvl.tvl0 !== undefined &&
    backendVault.tvl.tvl1 !== undefined
  ) {
    tvlData = { tvl0: backendVault.tvl.tvl0, tvl1: backendVault.tvl.tvl1 };
    console.log("Using tvl.tvl0/tvl1 from backend:", tvlData);
  }
  // Check if tvl0/tvl1 are directly on the vault object (fallback)
  else if (backendVault.tvl0 !== undefined && backendVault.tvl1 !== undefined) {
    tvlData = { tvl0: backendVault.tvl0, tvl1: backendVault.tvl1 };
    console.log("Using direct tvl0/tvl1 from vault:", tvlData);
  }
  // Fallback to mock data
  else {
    tvlData = mockTvlData[index % mockTvlData.length];
    console.log("Using fallback mock TVL:", tvlData);
  }

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
    // Use real TVL data if available, otherwise fallback to mock
    tvl: tvlData,
    apy: mockApyData[index % mockApyData.length], // Keep mock APY for now
    status: "SaucerSwap",
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
