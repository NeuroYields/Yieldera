import { useState, useCallback } from "react";
import { AccountId, ContractId, TokenId } from "@hashgraph/sdk";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ContractFunctionParameterBuilder } from "../services/wallets/contractFunctionParameterBuilder";
import { metamaskWallet } from "../services/wallets/metamask/metamaskClient";
import { ethers } from "ethers";
import { toast } from "../hooks/useToastify";
import { VaultData } from "../types/api";
import { env } from "../config/env";

export const useVaultDeposit = (vaultData?: VaultData) => {
  const [loading, setLoading] = useState(false);
  const [transactionStage, setTransactionStage] = useState<
    "idle" | "approving" | "depositing" | "confirming" | "success" | "error"
  >("idle");
  const { accountId, walletInterface } = useWalletInterface();

  const getMirrorNodeUrl = () => {
    const network = env.HEDERA_NETWORK;
    const baseUrl =
      network === "testnet"
        ? "https://testnet.mirrornode.hedera.com/api/v1"
        : "https://mainnet.mirrornode.hedera.com/api/v1";

    console.log(`Using ${network} Mirror Node API: ${baseUrl}`);
    return baseUrl;
  };

  const depositToVault = useCallback(
    async (deposit0Amount: string, deposit1Amount: string) => {
      if (!walletInterface || !accountId) {
        throw new Error("Wallet not connected");
      }

      if (!vaultData) {
        throw new Error("Vault data is required for deposits");
      }

      setLoading(true);
      setTransactionStage("idle");

      try {
        const deposit0 = parseFloat(deposit0Amount || "0");
        let deposit1 = parseFloat(deposit1Amount || "0");

        if (deposit0 <= 0 && deposit1 <= 0) {
          throw new Error("Please enter at least one deposit amount");
        }

        const vaultContractId = ContractId.fromEvmAddress(
          0,
          0,
          vaultData.address
        );
        const vaultContractAddress = vaultData.address;

        // Debug logging to ensure we're using the correct vault address
        console.log("=== VAULT CONTRACT DEBUG ===");
        console.log("Using vault address from backend:", vaultContractAddress);
        console.log("Vault contract ID:", vaultContractId.toString());
        console.log("Vault name:", vaultData.name);

        // Get token information from vault data
        const token0Data = vaultData.pool.token0;
        const token1Data = vaultData.pool.token1;
        const token0Symbol = token0Data.symbol;
        const token1Symbol = token1Data.symbol;
        const token0Decimals = token0Data.decimals;
        const token1Decimals = token1Data.decimals;

        const getTokenIdFromAddress = async (
          tokenData: any,
          symbol: string
        ): Promise<string> => {
          const address = tokenData.address;

          // Handle native HBAR using isNativeWrapper flag
          if (tokenData.isNativeWrapper || symbol === "HBAR") {
            console.log(
              `Token ${symbol} is native wrapper, using HBAR ID 0.0.0`
            );
            return "0.0.0";
          }

          // Handle native HBAR - check for multiple possible HBAR addresses
          if (
            !address ||
            address === "" ||
            address === "0x0000000000000000000000000000000000000000" ||
            address === "0x0000000000000000000000000000000000003aD2" || // Native HBAR on Hedera
            symbol === "WHBAR"
          ) {
            console.log(
              `Token ${symbol} matches native HBAR address patterns, using HBAR ID 0.0.0`
            );
            return "0.0.0";
          }

          // Known token mappings (network-dependent)
          const getKnownTokens = (): { [key: string]: string } => {
            const network = env.HEDERA_NETWORK;

            if (network === "testnet") {
              return {
                "0x0000000000000000000000000000000000001549": "0.0.5449", // USDC testnet
                "0x0000000000000000000000000000000000001599": "0.0.5529", // DAI testnet
                "0x0000000000000000000000000000000000120f46": "0.0.1183558", // SAUCE testnet (example)
                // Add more testnet token mappings as needed
              };
            } else {
              // Mainnet token mappings
              return {
                "0x0000000000000000000000000000000000120f46": "0.0.731861", // SAUCE token
                "0x000000000000000000000000000000000006f89a": "0.0.456858", // USDC token
              };
            }
          };

          const knownTokens = getKnownTokens();

          const normalizedAddress = address.toLowerCase();
          if (knownTokens[normalizedAddress]) {
            const tokenId = knownTokens[normalizedAddress];
            console.log(
              `Found token ID ${tokenId} for ${symbol} using known mapping`
            );
            return tokenId;
          }

          // If the address is already in Hedera format (0.0.xxx), use it directly
          if (address.match(/^0\.0\.\d+$/)) {
            return address;
          }

          // For EVM addresses, try to convert using Mirror Node API
          try {
            console.log(
              `Converting EVM address ${address} for token ${symbol} to Hedera token ID`
            );

            const mirrorNodeUrl = getMirrorNodeUrl();

            // Try querying by account.id parameter first
            let response = await fetch(
              `${mirrorNodeUrl}/tokens?account.id=${address}`
            );
            let data = await response.json();

            if (data.tokens && data.tokens.length > 0) {
              // Find the token that matches our symbol
              const matchingToken = data.tokens.find(
                (token: any) => token.symbol === symbol
              );

              if (matchingToken) {
                const tokenId = matchingToken.token_id;
                console.log(
                  `Found token ID ${tokenId} for ${symbol} address ${address} via account.id query`
                );
                return tokenId;
              }
            }

            // Fallback: try the original token.id query
            response = await fetch(
              `${mirrorNodeUrl}/tokens?token.id=${address}`
            );
            data = await response.json();

            if (data.tokens && data.tokens.length > 0) {
              const tokenId = data.tokens[0].token_id;
              console.log(
                `Found token ID ${tokenId} for ${symbol} address ${address} via token.id query`
              );
              return tokenId;
            }
          } catch (error) {
            console.warn(
              `Failed to convert address ${address} using Mirror Node:`,
              error
            );
          }

          // If we can't convert it, throw an error with helpful info
          throw new Error(
            `Unable to find Hedera token ID for ${symbol} with address ${address}. Backend should provide token IDs or conversion failed.`
          );
        };

        // Get token IDs for both tokens
        const token0Id = await getTokenIdFromAddress(token0Data, token0Symbol);
        const token1Id = await getTokenIdFromAddress(token1Data, token1Symbol);

        // Token0 approval if needed (for non-native token)
        if (deposit0 > 0 && !token0Data.isNativeWrapper) {
          setTransactionStage("approving");
          const token0AmountRaw = Math.floor(
            deposit0 * Math.pow(10, token0Decimals)
          );

          await toast.promise(
            (async () => {
              try {
                const approvalTxHash = await metamaskWallet.approveToken(
                  ContractId.fromString(token0Id),
                  vaultContractAddress,
                  token0AmountRaw
                );

                if (!approvalTxHash) {
                  throw new Error(
                    `${token0Symbol} approval transaction failed`
                  );
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
                    `${token0Symbol} approval failed with status: ${receipt.status}`
                  );
                }

                return receipt;
              } catch (metamaskError: any) {
                console.log(
                  `MetaMask ${token0Symbol} approval failed, trying HTS:`,
                  metamaskError.message
                );

                // Fallback to HTS precompile approval
                const approvalResult = await walletInterface.approveToken(
                  ContractId.fromString(token0Id),
                  vaultContractAddress,
                  token0AmountRaw
                );
                return approvalResult;
              }
            })(),
            {
              loadingMessage: `Approving ${deposit0} ${token0Symbol} tokens...`,
              successMessage: `${token0Symbol} tokens approved successfully!`,
              errorMessage: `Failed to approve ${token0Symbol} tokens`,
            }
          );
        }

        // Token1 approval if needed (for non-native token)
        if (deposit1 > 0 && !token1Data.isNativeWrapper) {
          setTransactionStage("approving");
          const token1AmountRaw = Math.floor(
            deposit1 * Math.pow(10, token1Decimals)
          );

          await toast.promise(
            (async () => {
              try {
                const approvalTxHash = await metamaskWallet.approveToken(
                  ContractId.fromString(token1Id),
                  vaultContractAddress,
                  token1AmountRaw
                );

                if (!approvalTxHash) {
                  throw new Error(
                    `${token1Symbol} approval transaction failed`
                  );
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
                    `${token1Symbol} approval failed with status: ${receipt.status}`
                  );
                }

                return receipt;
              } catch (metamaskError: any) {
                console.log(
                  `MetaMask ${token1Symbol} approval failed, trying HTS:`,
                  metamaskError.message
                );

                // Fallback to HTS precompile approval
                const approvalResult = await walletInterface.approveToken(
                  ContractId.fromString(token1Id),
                  vaultContractAddress,
                  token1AmountRaw
                );
                return approvalResult;
              }
            })(),
            {
              loadingMessage: `Approving ${deposit1} ${token1Symbol} tokens...`,
              successMessage: `${token1Symbol} tokens approved successfully!`,
              errorMessage: `Failed to approve ${token1Symbol} tokens`,
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
              value:
                deposit0 > 0
                  ? Math.floor(
                      deposit0 * Math.pow(10, token0Decimals)
                    ).toString()
                  : "0",
            })
            .addParam({
              type: "uint256",
              name: "deposit1",
              value:
                deposit1 > 0
                  ? Math.floor(
                      deposit1 * Math.pow(10, token1Decimals)
                    ).toString()
                  : "0",
            })
            .addParam({
              type: "address",
              name: "to",
              value: AccountId.fromString(accountId).toEvmAddress(),
            });
          // If token1 is native wrapper (HBAR), use deposit1 amount
          // If token0 is native wrapper (HBAR), use deposit0 amount
          let hbarAmount: number | undefined;
          if (token1Data.isNativeWrapper && deposit1 > 0) {
            hbarAmount = Math.floor(deposit1 * 1e18);
          } else if (token0Data.isNativeWrapper && deposit0 > 0) {
            hbarAmount = Math.floor(deposit0 * 1e18);
          }

          const txResult = await walletInterface.executeContractFunction(
            vaultContractId,
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
              deposit0 > 0 ? `${deposit0} ${token0Symbol}` : ""
            }${deposit0 > 0 && deposit1 > 0 ? " and " : ""}${
              deposit1 > 0 ? `${deposit1} ${token1Symbol}` : ""
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
    [walletInterface, accountId, vaultData]
  );

  return {
    depositToVault,
    loading,
    transactionStage,
    isConnected: !!walletInterface && !!accountId,
  };
};
