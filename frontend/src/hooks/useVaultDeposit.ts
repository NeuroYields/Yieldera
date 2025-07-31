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

export const useVaultDeposit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accountId, walletInterface } = useWalletInterface();

  const depositToVault = useCallback(
    async (deposit0Amount: string, deposit1Amount: string) => {
      if (!walletInterface || !accountId) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      setError(null);

      try {
        const deposit0 = parseFloat(deposit0Amount || "0");
        let deposit1 = parseFloat(deposit1Amount || "0");

        if (deposit0 <= 0 && deposit1 <= 0) {
          throw new Error("Please enter at least one deposit amount");
        }

        const vaultContractId = YIELDERA_CONTRACT_ID;
        const sauceTokenId = "0.0.1183558";

        // approval for SAUCE
        if (deposit1 > 0) {
          try {
            const sauceAmountRaw = Math.floor(deposit1 * 1e6);

            try {
              const approvalTxHash = await metamaskWallet.approveToken(
                ContractId.fromString(sauceTokenId),
                YIELDERA_CONTRACT_ADDRESS,
                sauceAmountRaw
              );
              console.log("SAUCE approval transaction hash:", approvalTxHash);

              if (!approvalTxHash) {
                throw new Error("SAUCE approval transaction failed");
              }

              //  transaction confirmation using ethers
              const provider = new ethers.providers.Web3Provider(
                (window as any).ethereum
              );
              const receipt = await provider.waitForTransaction(approvalTxHash);

              if (receipt.status !== 1) {
                throw new Error(
                  `SAUCE approval failed with status: ${receipt.status}`
                );
              }

              console.log("SAUCE approval confirmed via MetaMask:", receipt);
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
              console.log("SAUCE approval successful via HTS:", approvalResult);
            }
          } catch (approvalError: any) {
            console.error("SAUCE approval failed:", approvalError.message);
            setError(`SAUCE token approval failed: ${approvalError.message}`);
            return;
          }
        }

        //  deposit with  HBAR and SAUCE
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
          throw new Error("Transaction failed - no transaction hash returned");
        }

        console.log("Deposit transaction hash:", txResult);

        try {
          const provider = new ethers.providers.Web3Provider(
            (window as any).ethereum
          );
          const receipt = await provider.waitForTransaction(txResult);

          if (receipt.status !== 1) {
            throw new Error(
              `Deposit transaction failed with status: ${receipt.status}`
            );
          }

          console.log("Deposit transaction successfully:", receipt);

          return txResult;
        } catch (receiptError: any) {
          console.error("Transaction confirmation failed:", receiptError);
          throw new Error(`Transaction failed: ${receiptError.message}`);
        }
      } catch (err: any) {
        console.error("Deposit error:", err);
        setError(err.message || "Deposit failed");
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
    error,
    isConnected: !!walletInterface && !!accountId,
  };
};
