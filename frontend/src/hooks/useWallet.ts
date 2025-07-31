import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
    hashpack?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  walletType: "metamask" | "hashpack" | "blade" | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    walletType: null,
  });

  const connectMetaMask = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        setWalletState({
          isConnected: true,
          address,
          balance: ethers.utils.formatEther(balance),
          chainId: Number(network.chainId),
          walletType: "metamask",
        });

        return { address, balance: ethers.utils.formatEther(balance) };
      } catch (error) {
        console.error("Failed to connect MetaMask:", error);
        throw error;
      }
    } else {
      throw new Error("MetaMask not found");
    }
  }, []);

  const connectHashPack = useCallback(async () => {
    // HashPack integration for Hedera native
    if (typeof window !== "undefined" && window.hashpack) {
      try {
        const hashpack = window.hashpack;
        const data = await hashpack.connectToLocalWallet();

        setWalletState({
          isConnected: true,
          address: data.accountIds[0],
          balance: null, // Will need to fetch from Hedera API
          chainId: 296, // Hedera testnet
          walletType: "hashpack",
        });

        return { address: data.accountIds[0] };
      } catch (error) {
        console.error("Failed to connect HashPack:", error);
        throw error;
      }
    } else {
      throw new Error("HashPack not found");
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      walletType: null,
    });
  }, []);

  const switchToHederaTestnet = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x128" }], // 296 in hex
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          // Chain not added, add it
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x128",
                chainName: "Hedera Testnet",
                nativeCurrency: {
                  name: "HBAR",
                  symbol: "HBAR",
                  decimals: 18,
                },
                rpcUrls: ["https://testnet.hashio.io/api"],
                blockExplorerUrls: ["https://hashscan.io/testnet"],
              },
            ],
          });
        }
      }
    }
  }, []);

  return {
    walletState,
    connectMetaMask,
    connectHashPack,
    disconnect,
    switchToHederaTestnet,
  };
};
