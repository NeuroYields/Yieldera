import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { VaultData } from "../types/api";

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  isNativeWrapper: boolean;
}

export const useUserTokenBalances = (vaults?: VaultData[]) => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accountId } = useWalletInterface();

  // Extract unique tokens from all vaults
  const getUniqueTokens = useCallback((vaults: VaultData[]) => {
    const tokenMap = new Map();

    vaults.forEach((vault) => {
      // Token0
      if (!tokenMap.has(vault.pool.token0.address)) {
        tokenMap.set(vault.pool.token0.address, {
          address: vault.pool.token0.address,
          symbol: vault.pool.token0.symbol,
          name: vault.pool.token0.name,
          decimals: vault.pool.token0.decimals,
          isNativeWrapper: vault.pool.token0.isNativeWrapper,
        });
      }

      // Token1
      if (!tokenMap.has(vault.pool.token1.address)) {
        tokenMap.set(vault.pool.token1.address, {
          address: vault.pool.token1.address,
          symbol: vault.pool.token1.symbol,
          name: vault.pool.token1.name,
          decimals: vault.pool.token1.decimals,
          isNativeWrapper: vault.pool.token1.isNativeWrapper,
        });
      }
    });

    return Array.from(tokenMap.values());
  }, []);

  const fetchTokenBalance = useCallback(
    async (
      tokenAddress: string,
      decimals: number,
      isNativeWrapper: boolean,
      userAddress: string
    ): Promise<{ balance: string; balanceFormatted: string }> => {
      try {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );

        // Handle native HBAR balance
        if (
          isNativeWrapper ||
          tokenAddress === "0x0000000000000000000000000000000000000000"
        ) {
          const balance = await provider.getBalance(userAddress);
          return {
            balance: balance.toString(),
            balanceFormatted: ethers.utils.formatEther(balance),
          };
        }

        // Handle ERC20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider
        );

        const balance = await tokenContract.balanceOf(userAddress);
        return {
          balance: balance.toString(),
          balanceFormatted: ethers.utils.formatUnits(balance, decimals),
        };
      } catch (error) {
        console.warn(
          `Failed to fetch balance for token ${tokenAddress}:`,
          error
        );
        return {
          balance: "0",
          balanceFormatted: "0.0",
        };
      }
    },
    []
  );

  const fetchAllBalances = useCallback(async () => {
    if (!vaults || vaults.length === 0 || !accountId) {
      setBalances([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user's EVM address
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum
      );
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get unique tokens from all vaults
      const uniqueTokens = getUniqueTokens(vaults);

      // Fetch balances for all tokens in parallel
      const balancePromises = uniqueTokens.map(async (token) => {
        const { balance, balanceFormatted } = await fetchTokenBalance(
          token.address,
          token.decimals,
          token.isNativeWrapper,
          userAddress
        );

        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance,
          balanceFormatted,
          isNativeWrapper: token.isNativeWrapper,
        } as TokenBalance;
      });

      const tokenBalances = await Promise.all(balancePromises);

      // Sort by balance value (descending) and then by symbol
      const sortedBalances = tokenBalances.sort((a, b) => {
        const balanceA = parseFloat(a.balanceFormatted);
        const balanceB = parseFloat(b.balanceFormatted);

        if (balanceA === balanceB) {
          return a.symbol.localeCompare(b.symbol);
        }

        return balanceB - balanceA;
      });

      setBalances(sortedBalances);
    } catch (err: any) {
      console.error("Error fetching token balances:", err);
      setError(err.message || "Failed to fetch token balances");
    } finally {
      setLoading(false);
    }
  }, [vaults, accountId, getUniqueTokens, fetchTokenBalance]);

  // Fetch balances when vaults or accountId change
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Refresh balances function
  const refresh = useCallback(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  return {
    balances,
    loading,
    error,
    refresh,
    hasData: balances.length > 0,
  };
};
