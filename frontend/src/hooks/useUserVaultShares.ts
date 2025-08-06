import { useState, useCallback, useEffect } from "react";
import { ContractId } from "@hashgraph/sdk";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ethers } from "ethers";
import { VaultData } from "../types/api";

export interface UserVaultShare {
  vaultAddress: string;
  shareBalance: string;
  shareBalanceFormatted: string;
  token0Amount: string;
  token1Amount: string;
}

export const useUserVaultShares = (vaults?: VaultData[]) => {
  const [userShares, setUserShares] = useState<UserVaultShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accountId, walletInterface } = useWalletInterface();

  const fetchUserShares = useCallback(async () => {
    if (!walletInterface || !accountId || !vaults || vaults.length === 0) {
      setUserShares([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum
      );
      const signer = provider.getSigner();
      const userEVMAddress = await signer.getAddress();

      const sharePromises = vaults.map(async (vault) => {
        try {
          const vaultContract = new ethers.Contract(
            vault.address,
            [
              "function balanceOf(address account) view returns (uint256)",
              "function totalSupply() view returns (uint256)",
              "function getTotalAmounts() view returns (uint256 total0, uint256 total1)",
            ],
            provider
          );

          const [shareBalance, totalSupply, totalAmounts] = await Promise.all([
            vaultContract.balanceOf(userEVMAddress),
            vaultContract.totalSupply(),
            vaultContract.getTotalAmounts(),
          ]);

          const shareBalanceStr = shareBalance.toString();
          const shareBalanceFormatted = ethers.utils.formatEther(shareBalance);

          // If user has no shares, return zero position
          if (shareBalance.eq(0)) {
            return {
              vaultAddress: vault.address,
              shareBalance: "0",
              shareBalanceFormatted: "0.000000",
              token0Amount: "0.000000",
              token1Amount: "0.000000",
            };
          }

          // Calculate token amounts using simple proportion
          const userToken0Amount = totalAmounts.total0
            .mul(shareBalance)
            .div(totalSupply);
          const userToken1Amount = totalAmounts.total1
            .mul(shareBalance)
            .div(totalSupply);

          // Use the correct decimals from vault data
          const token0Decimals = vault.pool.token0.decimals;
          const token1Decimals = vault.pool.token1.decimals;

          const token0Formatted = ethers.utils.formatUnits(
            userToken0Amount,
            token0Decimals
          );
          const token1Formatted = ethers.utils.formatUnits(
            userToken1Amount,
            token1Decimals
          );

          return {
            vaultAddress: vault.address,
            shareBalance: shareBalanceStr,
            shareBalanceFormatted: shareBalanceFormatted,
            token0Amount: parseFloat(token0Formatted).toFixed(6),
            token1Amount: parseFloat(token1Formatted).toFixed(6),
          };
        } catch (vaultError) {
          console.error(
            `Error fetching shares for vault ${vault.address}:`,
            vaultError
          );
          return {
            vaultAddress: vault.address,
            shareBalance: "0",
            shareBalanceFormatted: "0.000000",
            token0Amount: "0.000000",
            token1Amount: "0.000000",
          };
        }
      });

      const shares = await Promise.all(sharePromises);
      setUserShares(shares);
    } catch (err: any) {
      console.error("Error fetching user vault shares:", err);
      setError(err.message || "Failed to fetch vault shares");
      setUserShares([]);
    } finally {
      setLoading(false);
    }
  }, [walletInterface, accountId, vaults]);

  useEffect(() => {
    fetchUserShares();
  }, [fetchUserShares]);

  return {
    userShares,
    loading,
    error,
    refresh: fetchUserShares,
  };
};
