import { useState, useCallback } from "react";
import { AccountId, ContractId, TokenId } from "@hashgraph/sdk";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ContractFunctionParameterBuilder } from "../services/wallets/contractFunctionParameterBuilder";
import {
  YIELDERA_CONTRACT_ADDRESS,
  YIELDERA_CONTRACT_ID,
} from "../config/constants";
import { metamaskWallet } from "../services/wallets/metamask/metamaskClient";
import { ethers } from "ethers";
import { toast } from "../hooks/useToastify";

export const useVaultDeposit = () => {
  const [loading, setLoading] = useState(false);
  const [transactionStage, setTransactionStage] = useState<
    "idle" | "approving" | "depositing" | "confirming" | "success" | "error"
  >("idle");
  const { accountId, walletInterface } = useWalletInterface();

  const depositToVault = useCallback(
    async (deposit0Amount: string, deposit1Amount: string) => {
      if (!walletInterface || !accountId) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setTransactionStage("idle");

      try {
        const deposit0 = parseFloat(deposit0Amount || "0");
        let deposit1 = parseFloat(deposit1Amount || "0");

        if (deposit0 <= 0 && deposit1 <= 0) {
          throw new Error("Please enter at least one deposit amount");
        }

        const vaultContractId = YIELDERA_CONTRACT_ID;
        const sauceTokenId = "0.0.1183558";

        // SAUCE token approval if needed
        if (deposit1 > 0) {
          setTransactionStage("approving");
          const sauceAmountRaw = Math.floor(deposit1 * 1e6);

          await toast.promise(
            (async () => {
              try {
                const approvalTxHash = await metamaskWallet.approveToken(
                  ContractId.fromString(sauceTokenId),
                  YIELDERA_CONTRACT_ADDRESS,
                  sauceAmountRaw
                );

                if (!approvalTxHash) {
                  throw new Error("SAUCE approval transaction failed");
                }

                // Wait for transaction confirmation
                const provider = new ethers.providers.Web3Provider(
                  (window as any).ethereum
                );
                const receipt = await provider.waitForTransaction(
                  approvalTxHash
                );

                if (receipt.status !== 1) {
                  throw new Error(
                    `SAUCE approval failed with status: ${receipt.status}`
                  );
                }

                return receipt;
              } catch (metamaskError: any) {
                console.log(
                  "MetaMask SAUCE approval failed, trying HTS:",
                  metamaskError.message
                );

                // Fallback to HTS precompile approval
                const approvalResult = await walletInterface.approveToken(
                  ContractId.fromString(sauceTokenId),
                  YIELDERA_CONTRACT_ADDRESS,
                  sauceAmountRaw
                );
                return approvalResult;
              }
            })(),
            {
              loadingMessage: `Approving ${deposit1} SAUCE tokens...`,
              successMessage: "SAUCE tokens approved successfully!",
              errorMessage: "Failed to approve SAUCE tokens",
            }
          );
        }

        // Execute deposit transaction
        setTransactionStage("depositing");
        const depositPromise = (async () => {
          const functionParameters = new ContractFunctionParameterBuilder()
            .addParam({
              type: "uint256",
              name: "deposit0",
              value: deposit0 > 0 ? Math.floor(deposit0 * 1e8).toString() : "0",
            })
            .addParam({
              type: "uint256",
              name: "deposit1",
              value: deposit1 > 0 ? Math.floor(deposit1 * 1e6).toString() : "0",
            })
            .addParam({
              type: "address",
              name: "to",
              value: AccountId.fromString(accountId).toEvmAddress(),
            });

          // MetaMask requires msg.value in wei (18 decimals) for HBAR
          const hbarAmount =
            deposit0 > 0 ? Math.floor(deposit0 * 1e18) : undefined;

          const txResult = await walletInterface.executeContractFunction(
            ContractId.fromString(vaultContractId),
            "deposit",
            functionParameters,
            800000,
            hbarAmount
          );

          if (!txResult) {
            throw new Error(
              "Transaction failed - no transaction hash returned"
            );
          }

          return txResult;
        })();

        // Handle deposit transaction with confirmation
        setTransactionStage("confirming");
        const txResult = await toast.transaction(
          (async () => {
            const txHash = await depositPromise;

            // Wait for transaction confirmation
            const provider = new ethers.providers.Web3Provider(
              (window as any).ethereum
            );
            const receipt = await provider.waitForTransaction(txHash);

            if (receipt.status !== 1) {
              throw new Error(
                `Deposit transaction failed with status: ${receipt.status}`
              );
            }

            return { txHash, receipt };
          })(),
          {
            loadingMessage: `Depositing ${
              deposit0 > 0 ? `${deposit0} HBAR` : ""
            }${deposit0 > 0 && deposit1 > 0 ? " and " : ""}${
              deposit1 > 0 ? `${deposit1} SAUCE` : ""
            }...`,
            successMessage: "Deposit completed successfully!",
            errorMessage: "Deposit transaction failed",
            txHash: await depositPromise,
          }
        );

        setTransactionStage("success");
        console.log("Deposit transaction successful:", txResult);

        return txResult.txHash;
      } catch (err: any) {
        setTransactionStage("error");
        console.error("Deposit error:", err);
        // Don't show additional toast as it's already handled by toast.promise/toast.transaction
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletInterface, accountId]
  );

  return {
    depositToVault,
    loading,
    transactionStage,
    isConnected: !!walletInterface && !!accountId,
  };
};
