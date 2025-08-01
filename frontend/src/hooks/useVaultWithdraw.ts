import { useState, useCallback, useEffect } from "react";
import { AccountId, ContractId } from "@hashgraph/sdk";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ContractFunctionParameterBuilder } from "../services/wallets/contractFunctionParameterBuilder";
import {
  YIELDERA_CONTRACT_ADDRESS,
  YIELDERA_CONTRACT_ID,
} from "../config/constants";
import { ethers } from "ethers";
import { toast } from "./useToastify";

export interface UserVaultPosition {
  shareBalance: string;
  shareBalanceFormatted: string;
  token0Amount: string;
  token1Amount: string;
}

export interface VaultInfo {
  name: string;
  symbol: string;
}

export const useVaultWithdraw = () => {
  const [loading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState<UserVaultPosition | null>(
    null
  );
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(false);
  const [transactionStage, setTransactionStage] = useState<
    "idle" | "withdrawing" | "confirming" | "success" | "error"
  >("idle");
  const { accountId, walletInterface } = useWalletInterface();

  useEffect(() => {
    console.log("user position", userPosition);
  }, [userPosition]);

  // Get user's vault position (shares and estimated token amounts)
  const fetchUserPosition = useCallback(async () => {
    if (!walletInterface || !accountId) {
      setUserPosition(null);
      return;
    }

    setLoadingPosition(true);

    try {
      const vaultContractId = YIELDERA_CONTRACT_ID;

      // Call balanceOf to get user's shares using MetaMask for better compatibility
      try {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        const signer = provider.getSigner();

        // Get user's EVM address directly from MetaMask
        const userEVMAddress = await signer.getAddress();
        console.log("=== USER INFO ===");
        console.log("Connected EVM Address:", userEVMAddress);
        console.log("AccountId from context:", accountId);

        const vaultContract = new ethers.Contract(
          YIELDERA_CONTRACT_ADDRESS,
          [
            "function balanceOf(address account) view returns (uint256)",
            "function totalSupply() view returns (uint256)",
            "function getTotalAmounts() view returns (uint256 total0, uint256 total1)",
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function lowerTick() view returns (int24)",
            "function upperTick() view returns (int24)",
            "function isActive() view returns (bool)",
            "function getCurrentPosition() view returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
          ],
          provider
        );

        const [
          shareBalance,
          totalSupply,
          totalAmounts,
          name,
          symbol,
          lowerTick,
          upperTick,
          isActive,
          currentPosition,
        ] = await Promise.all([
          vaultContract.balanceOf(userEVMAddress),
          vaultContract.totalSupply(),
          vaultContract.getTotalAmounts(),
          vaultContract.name(),
          vaultContract.symbol(),
          vaultContract.lowerTick(),
          vaultContract.upperTick(),
          vaultContract.isActive(),
          vaultContract.getCurrentPosition(),
        ]);

        // Store vault info
        setVaultInfo({ name, symbol });

        const shareBalanceStr = shareBalance.toString();
        const shareBalanceFormatted = ethers.utils.formatEther(shareBalance);

        console.log("Share balance formatted:", shareBalanceFormatted);

        // If user has no shares, return zero position
        if (shareBalance.eq(0)) {
          setUserPosition({
            shareBalance: "0",
            shareBalanceFormatted: "0.000000",
            token0Amount: "0.000000",
            token1Amount: "0.00",
          });
          return;
        }

        // Calculate user's share percentage
        const userSharePercentage = shareBalance.mul(10000).div(totalSupply);
        console.log(
          "User share percentage (basis points):",
          userSharePercentage.toString()
        );
        console.log(
          "User share percentage (%):",
          userSharePercentage.toNumber() / 100
        );

        // Calculate token amounts using simple proportion
        const userToken0Amount = totalAmounts.total0
          .mul(shareBalance)
          .div(totalSupply);
        const userToken1Amount = totalAmounts.total1
          .mul(shareBalance)
          .div(totalSupply);

        console.log("User token0 amount (wei):", userToken0Amount.toString());
        console.log("User token1 amount (raw):", userToken1Amount.toString());

        const token0Formatted = ethers.utils.formatUnits(userToken0Amount, 8);
        const token1Formatted = ethers.utils.formatUnits(userToken1Amount, 6);

        console.log("Token0 formatted (WHBAR):", token0Formatted);
        console.log("Token1 formatted (SAUCE):", token1Formatted);

        setUserPosition({
          shareBalance: shareBalanceStr,
          shareBalanceFormatted: parseFloat(shareBalanceFormatted).toFixed(9),
          token0Amount: parseFloat(token0Formatted).toFixed(9),
          token1Amount: parseFloat(token1Formatted).toFixed(2),
        });
      } catch (metamaskError) {
        console.error(
          "MetaMask call failed, trying Hedera SDK:",
          metamaskError
        );

        // Fallback to original SDK approach
        const userEVMAddressFallback =
          AccountId.fromString(accountId).toEvmAddress();

        const balanceOfParams = new ContractFunctionParameterBuilder().addParam(
          {
            type: "address",
            name: "account",
            value: userEVMAddressFallback,
          }
        );

        const shareBalanceResult =
          await walletInterface.executeContractFunction(
            ContractId.fromString(vaultContractId),
            "balanceOf",
            balanceOfParams,
            100000
          );

        if (!shareBalanceResult) {
          throw new Error("Failed to fetch share balance");
        }

        // fallback calculation
        const shareBalance = shareBalanceResult.toString();
        const shareBalanceFormatted = (parseFloat(shareBalance) / 1e18).toFixed(
          6
        );

        setUserPosition({
          shareBalance,
          shareBalanceFormatted,
          token0Amount: "0.000000",
          token1Amount: "0.00",
        });
      }
    } catch (err: any) {
      console.error("Error fetching user position:", err);
      // Only show toast for significant errors, not for normal "no position" cases
      if (err.message && !err.message.includes("no position")) {
        toast.error(`Failed to fetch position: ${err.message}`);
      }
      setUserPosition(null);
    } finally {
      setLoadingPosition(false);
    }
  }, [walletInterface, accountId]);

  // Withdraw shares from vault
  const withdrawFromVault = useCallback(
    async (shareAmount: string) => {
      if (!walletInterface || !accountId) {
        throw new Error("Wallet not connected");
      }

      if (!userPosition) {
        throw new Error("User position not loaded");
      }

      setLoading(true);
      setTransactionStage("withdrawing");

      try {
        const userShareBalance = ethers.BigNumber.from(
          userPosition.shareBalance
        );
        const shareBalanceFormatted = parseFloat(
          userPosition.shareBalanceFormatted
        );
        const shareAmountNum = parseFloat(shareAmount);

        // Calculate the raw amount proportionally
        const shareAmountRaw = userShareBalance
          .mul(Math.floor(shareAmountNum * 1e18))
          .div(Math.floor(shareBalanceFormatted * 1e18));

        if (shareAmountRaw.lte(0)) {
          throw new Error("Please enter a valid share amount");
        }

        if (shareAmountRaw.gt(userShareBalance)) {
          throw new Error(
            `Insufficient share balance. Trying to withdraw ${shareAmountRaw.toString()} but only have ${userShareBalance.toString()}`
          );
        }

        const vaultContractId = YIELDERA_CONTRACT_ID;

        // Execute withdrawal with enhanced toast notifications
        const withdrawResult = await toast.transaction(
          (async () => {
            // Create withdraw function parameters
            const functionParameters = new ContractFunctionParameterBuilder()
              .addParam({
                type: "uint256",
                name: "shares",
                value: shareAmountRaw.toString(),
              })
              .addParam({
                type: "address",
                name: "to",
                value: AccountId.fromString(accountId).toEvmAddress(),
              });

            console.log("Executing withdraw transaction...");

            const txResult = await walletInterface.executeContractFunction(
              ContractId.fromString(vaultContractId),
              "withdraw",
              functionParameters,
              600000
            );

            if (!txResult) {
              throw new Error(
                "Transaction failed - no transaction hash returned"
              );
            }

            // Wait for transaction confirmation
            setTransactionStage("confirming");
            const provider = new ethers.providers.Web3Provider(
              (window as any).ethereum
            );
            const receipt = await provider.waitForTransaction(txResult);

            if (receipt.status !== 1) {
              throw new Error(
                `Withdraw transaction failed with status: ${receipt.status}`
              );
            }

            return { txHash: txResult, receipt };
          })(),
          {
            loadingMessage: `Withdrawing ${shareAmount} LP tokens...`,
            successMessage: "Withdrawal completed successfully!",
            errorMessage: "Withdrawal transaction failed",
            txHash: undefined, // Will be updated when available
          }
        );

        setTransactionStage("success");
        console.log("Withdraw transaction successful:", withdrawResult);

        // Refresh position after successful withdrawal
        setTimeout(() => {
          fetchUserPosition();
        }, 2000); // Small delay to ensure blockchain state is updated

        return withdrawResult.txHash;
      } catch (err: any) {
        setTransactionStage("error");
        console.error("Withdraw error:", err);
        // Don't show additional toast as it's already handled by toast.transaction
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletInterface, accountId, userPosition, fetchUserPosition]
  );

  useEffect(() => {
    if (walletInterface && accountId) {
      fetchUserPosition();
    } else {
      setUserPosition(null);
    }
  }, [fetchUserPosition, walletInterface, accountId]);

  return {
    withdrawFromVault,
    fetchUserPosition,
    userPosition,
    vaultInfo,
    loading,
    loadingPosition,
    transactionStage,
    isConnected: !!walletInterface && !!accountId,
  };
};
