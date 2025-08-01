import { toast } from "../hooks/useToastify";

export const checkMetaMaskInstallation = (
  showToast: boolean = false
): boolean => {
  const { ethereum } = window as any;

  if (!ethereum) {
    if (showToast) {
      toast.error(
        "MetaMask is not installed. Please install MetaMask extension and refresh the page."
      );
    }
    return false;
  }

  if (!ethereum.isMetaMask) {
    if (showToast) {
      toast.warning(
        "MetaMask extension detected but may not be the primary wallet. Please ensure MetaMask is enabled."
      );
    }
    return false;
  }

  return true;
};

export const checkMetaMaskConnection = async (): Promise<boolean> => {
  try {
    const { ethereum } = window as any;

    if (!ethereum) {
      return false;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });
    return accounts && accounts.length > 0;
  } catch (error: any) {
    console.error("Error checking MetaMask connection:", error);
    return false;
  }
};

export const getMetaMaskErrorMessage = (error: any): string => {
  if (!error) return "Unknown error occurred";

  // Handle specific error codes
  switch (error.code) {
    case 4001:
      return "Connection request was rejected by the user";
    case 4100:
      return "The requested account and/or method has not been authorized by the user";
    case 4200:
      return "The requested method is not supported by this Ethereum provider";
    case 4900:
      return "The provider is disconnected from all chains";
    case 4901:
      return "The provider is disconnected from the specified chain";
    case -32002:
      return "MetaMask is already processing a request. Please wait and try again";
    case -32603:
      return "Internal error occurred. Please try again";
    default:
      return error.message || error.reason || "Unknown MetaMask error";
  }
};
