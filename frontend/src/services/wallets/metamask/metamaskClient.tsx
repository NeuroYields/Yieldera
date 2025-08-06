import { ContractId, AccountId } from "@hashgraph/sdk";
import { TokenId } from "@hashgraph/sdk/lib/transaction/TransactionRecord";
import { ethers } from "ethers";
import { useContext, useEffect } from "react";
import { appConfig } from "../../../config";
import { env } from "../../../config/env";
import { MetamaskContext } from "../../../contexts/MetamaskContext";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { WalletInterface } from "../walletInterface";
import { toast } from "../../../hooks/useToastify";
import {
  getMetaMaskErrorMessage,
  checkMetaMaskInstallation,
} from "../../../utils/metamaskHelpers";

// Helper function to detect user cancellation
const isUserCancellation = (error: any): boolean => {
  return (
    error?.code === 4001 ||
    error?.code === "ACTION_REJECTED" ||
    error?.message?.toLowerCase().includes("user denied") ||
    error?.message?.toLowerCase().includes("user rejected") ||
    error?.message?.toLowerCase().includes("transaction cancelled")
  );
};

const currentNetworkConfig = appConfig.networks[env.HEDERA_NETWORK];

export const switchToHederaNetwork = async (ethereum: any) => {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: currentNetworkConfig.chainId }], // chainId must be in hexadecimal numbers
    });
  } catch (error: any) {
    console.error("Network switch error:", error);

    if (error.code === 4902) {
      // Chain not added, try to add it
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainName: `Hedera (${currentNetworkConfig.network})`,
              chainId: currentNetworkConfig.chainId,
              nativeCurrency: {
                name: "HBAR",
                symbol: "HBAR",
                decimals: 18,
              },
              rpcUrls: [currentNetworkConfig.jsonRpcUrl],
            },
          ],
        });
      } catch (addError: any) {
        console.error("Failed to add Hedera network:", addError);
        const errorMessage = getMetaMaskErrorMessage(addError);
        throw new Error(`Failed to add Hedera network: ${errorMessage}`);
      }
    } else {
      const errorMessage = getMetaMaskErrorMessage(error);
      throw new Error(`Failed to switch to Hedera network: ${errorMessage}`);
    }
  }
};

const { ethereum } = window as any;
const getProvider = () => {
  if (!ethereum) {
    throw new Error(
      "MetaMask is not installed! Please install the MetaMask extension."
    );
  }

  return new ethers.providers.Web3Provider(ethereum);
};

// returns a list of accounts
// otherwise empty array
export const connectToMetamask = async () => {
  // Check MetaMask installation first and show toast to user
  if (!checkMetaMaskInstallation(true)) {
    throw new Error("MetaMask is not installed or properly configured.");
  }

  const provider = getProvider();

  // keep track of accounts returned
  let accounts: string[] = [];

  try {
    await switchToHederaNetwork(ethereum);
    accounts = await provider.send("eth_requestAccounts", []);

    if (accounts.length > 0) {
      toast.success("Successfully connected to MetaMask!");
    } else {
      toast.warning("No accounts found. Please ensure MetaMask is unlocked.");
    }
  } catch (error: any) {
    console.error("MetaMask connection error:", error);

    const errorMessage = getMetaMaskErrorMessage(error);

    if (error.code === 4001) {
      // User rejected the request
      toast.warning("Connection to MetaMask was cancelled by the user.");
    } else {
      toast.error(`Failed to connect to MetaMask: ${errorMessage}`);
    }

    // Re-throw the error with a proper message for upstream handling
    throw new Error(errorMessage);
  }

  return accounts;
};

class MetaMaskWallet implements WalletInterface {
  private convertAccountIdToSolidityAddress(accountId: AccountId): string {
    const accountIdString =
      accountId.evmAddress !== null
        ? accountId.evmAddress.toString()
        : accountId.toSolidityAddress();

    return `0x${accountIdString}`;
  }

  // Purpose: Transfer HBAR
  // Returns: Promise<string>
  // Note: Use JSON RPC Relay to search by transaction hash
  async transferHBAR(toAddress: AccountId, amount: number) {
    const provider = getProvider();
    const signer = await provider.getSigner();
    // build the transaction
    const tx = await signer.populateTransaction({
      to: this.convertAccountIdToSolidityAddress(toAddress),
      value: ethers.utils.parseEther(amount.toString()),
    });
    try {
      // send the transaction
      const txResponse = await signer.sendTransaction(tx);
      const receipt = await txResponse.wait();

      if (receipt.status === 0) {
        throw new Error("HBAR transfer failed");
      }

      return txResponse.hash;
    } catch (error: any) {
      console.error(
        "HBAR transfer failed:",
        error.message ? error.message : error
      );
      throw error; // Re-throw to let the calling code handle it
    }
  }

  async transferFungibleToken(
    toAddress: AccountId,
    tokenId: TokenId,
    amount: number
  ) {
    try {
      const hash = await this.executeContractFunction(
        ContractId.fromString(tokenId.toString()),
        "transfer",
        new ContractFunctionParameterBuilder()
          .addParam({
            type: "address",
            name: "recipient",
            value: this.convertAccountIdToSolidityAddress(toAddress),
          })
          .addParam({
            type: "uint256",
            name: "amount",
            value: amount,
          }),
        appConfig.constants.METAMASK_GAS_LIMIT_TRANSFER_FT
      );

      return hash;
    } catch (error: any) {
      console.error(
        "Fungible token transfer failed:",
        error.message ? error.message : error
      );
      throw error; // Re-throw to let the calling code handle it
    }
  }

  async transferNonFungibleToken(
    toAddress: AccountId,
    tokenId: TokenId,
    serialNumber: number
  ) {
    try {
      const provider = getProvider();
      const addresses = await provider.listAccounts();
      const hash = await this.executeContractFunction(
        ContractId.fromString(tokenId.toString()),
        "transferFrom",
        new ContractFunctionParameterBuilder()
          .addParam({
            type: "address",
            name: "from",
            value: addresses[0],
          })
          .addParam({
            type: "address",
            name: "to",
            value: this.convertAccountIdToSolidityAddress(toAddress),
          })
          .addParam({
            type: "uint256",
            name: "nftId",
            value: serialNumber,
          }),
        appConfig.constants.METAMASK_GAS_LIMIT_TRANSFER_NFT
      );

      return hash;
    } catch (error: any) {
      console.error(
        "NFT transfer failed:",
        error.message ? error.message : error
      );
      throw error; // Re-throw to let the calling code handle it
    }
  }

  async associateToken(tokenId: TokenId) {
    try {
      // HTS precompiled contract
      const HTS_PRECOMPILE_ADDRESS =
        "0x0000000000000000000000000000000000000167";

      // special contract call for HTS precompile
      const provider = getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const abi = [
        "function associateToken(address account, address token) returns (int64 responseCode)",
      ];
      const htsContract = new ethers.Contract(
        HTS_PRECOMPILE_ADDRESS,
        abi,
        signer
      );

      const txResult = await htsContract.associateToken(
        userAddress,
        `0x${ContractId.fromString(tokenId.toString()).toEvmAddress()}`,
        { gasLimit: 600000 } // Increased gas limit for SAUCE token association
      );

      console.log("HTS associateToken transaction sent:", txResult.hash);
      const receipt = await txResult.wait();

      console.log("HTS associateToken receipt:", receipt);

      if (receipt.status === 0) {
        throw new Error(
          `HTS associateToken failed with status 0. Receipt: ${JSON.stringify(
            receipt
          )}`
        );
      }

      console.log("HTS associateToken completed successfully");
      return txResult.hash;
    } catch (error: any) {
      console.error(
        "Token association failed:",
        error.message ? error.message : error
      );
      throw error;
    }
  }

  async approveToken(
    tokenContractId: ContractId,
    spenderAddress: string,
    amount: number
  ) {
    try {
      // Validate the amount
      if (amount <= 0) {
        throw new Error(
          `Invalid approval amount: ${amount}. Amount must be greater than 0.`
        );
      }

      // Check user's token balance first
      const provider = getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // check balance using ERC20 balanceOf
      try {
        const erc20Abi = [
          "function balanceOf(address owner) view returns (uint256)",
        ];
        const tokenContract = new ethers.Contract(
          `0x${tokenContractId.toEvmAddress()}`,
          erc20Abi,
          provider
        );

        const balance = await tokenContract.balanceOf(userAddress);

        // Just log a warning taw nrodha toast later on if needed
        if (balance.lt(amount)) {
          console.warn(
            `Warning: Trying to approve ${amount} but user only has ${balance.toString()} tokens`
          );
        }
      } catch (balanceError: any) {
        console.log("Could not check token balance:", balanceError.message);
        // Continue with approval anyway
      }

      // standard ERC20 approve
      try {
        console.log("Trying standard ERC20 approve...");

        const erc20Abi = [
          "function approve(address spender, uint256 amount) returns (bool)",
        ];
        const tokenContract = new ethers.Contract(
          `0x${tokenContractId.toEvmAddress()}`,
          erc20Abi,
          signer
        );

        const txResult = await tokenContract.approve(
          spenderAddress,
          amount.toString(),
          { gasLimit: 800000 }
        );

        console.log("ERC20 approve transaction sent:", txResult.hash);
        const receipt = await txResult.wait();

        console.log("ERC20 approve receipt:", receipt);

        if (receipt.status === 0) {
          throw new Error("ERC20 approve failed");
        }

        console.log("ERC20 approve completed successfully");
        return txResult.hash;
      } catch (erc20Error: any) {
        // Check if user cancelled the transaction - if so, don't try fallback
        if (isUserCancellation(erc20Error)) {
          console.log(
            "User cancelled ERC20 approval - not attempting HTS fallback"
          );
          throw erc20Error; // Re-throw the cancellation error without trying fallback
        }

        console.log(
          "ERC20 approve failed, trying HTS precompile...",
          erc20Error.message
        );

        // Fallback to HTS precompile
        const HTS_PRECOMPILE_ADDRESS =
          "0x0000000000000000000000000000000000000167";

        const abi = [
          "function approve(address token, address spender, uint256 amount) returns (int64 responseCode)",
        ];
        const htsContract = new ethers.Contract(
          HTS_PRECOMPILE_ADDRESS,
          abi,
          signer
        );

        console.log("Calling HTS approve...");
        const txResult = await htsContract.approve(
          `0x${tokenContractId.toEvmAddress()}`,
          spenderAddress,
          amount.toString(),
          { gasLimit: 800000 }
        );

        console.log("HTS approve transaction sent:", txResult.hash);
        const receipt = await txResult.wait();

        console.log("HTS approve receipt:", receipt);

        if (receipt.status === 0) {
          throw new Error(
            `HTS approve failed with status 0. Receipt: ${JSON.stringify(
              receipt
            )}`
          );
        }

        console.log("HTS approve completed successfully");
        return txResult.hash;
      }
    } catch (error: any) {
      console.error(
        "Token approval failed:",
        error.message ? error.message : error
      );
      throw error;
    }
  }

  // Purpose: Execute contract function with MetaMask
  // Returns: Promise<string> - Transaction hash
  async executeContractFunction(
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    gasLimit: number,
    payableAmount?: number
  ) {
    const provider = getProvider();
    const signer = await provider.getSigner();

    // Use the contract address directly from the contractId
    // No special handling needed - the calling code should pass the correct contract ID
    const contractAddress = `0x${contractId.toEvmAddress()}`;

    console.log("=== CONTRACT EXECUTION DEBUG ===");
    console.log("Contract ID:", contractId.toString());
    console.log("Contract Address:", contractAddress);
    console.log("Function:", functionName);

    // Build function signature and ABI
    const functionParams = functionParameters.buildAbiFunctionParams();
    const isPayable = payableAmount && payableAmount > 0;
    const abi = [
      `function ${functionName}(${functionParams})${
        isPayable ? " payable" : ""
      }`,
    ];

    // Create contract instance and execute
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const txOptions: any = {
        gasLimit: gasLimit === -1 ? undefined : gasLimit,
      };
      if (payableAmount && payableAmount > 0) {
        txOptions.value = ethers.BigNumber.from(payableAmount.toString());
      }

      console.log("Transaction Options:", txOptions);

      const txResult = await contract[functionName](
        ...functionParameters.buildEthersParams(),
        txOptions
      );

      console.log("Transaction sent, waiting for confirmation...");
      console.log("Transaction hash:", txResult.hash);

      // Wait for confirmation and verify success
      const receipt = await txResult.wait();
      console.log("Transaction receipt:", receipt);

      if (receipt.status === 0) {
        throw new Error(
          `Transaction failed with status 0. Receipt: ${JSON.stringify(
            receipt
          )}`
        );
      }

      console.log("Transaction successful!");
      return txResult.hash;
    } catch (error: any) {
      console.error(
        "Transaction failed:",
        error.message ? error.message : error
      );
      throw error;
    }
  }

  disconnect() {
    toast.info("Please disconnect using the Metamask extension.");
  }
}

export const metamaskWallet = new MetaMaskWallet();

export const MetaMaskClient = () => {
  const { setMetamaskAccountAddress } = useContext(MetamaskContext);
  useEffect(() => {
    // set the account address if already connected
    try {
      const provider = getProvider();
      provider
        .listAccounts()
        .then((signers) => {
          if (signers.length !== 0) {
            setMetamaskAccountAddress(signers[0]);
          } else {
            setMetamaskAccountAddress("");
          }
        })
        .catch((error: any) => {
          console.error("Failed to get MetaMask accounts:", error);
          setMetamaskAccountAddress("");
        });

      // listen for account changes and update the account address
      ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length !== 0) {
          setMetamaskAccountAddress(accounts[0]);
        } else {
          setMetamaskAccountAddress("");
        }
      });

      // cleanup by removing listeners
      return () => {
        ethereum.removeAllListeners("accountsChanged");
      };
    } catch (error: any) {
      console.error(
        "MetaMask initialization error:",
        error?.message || error?.reason || error
      );
      setMetamaskAccountAddress("");
    }
  }, [setMetamaskAccountAddress]);

  return null;
};
