import { toast } from "../hooks/useToastify";

export const handleTransactionFlow = async <T>(
  transactionPromise: Promise<T>,
  operation: "deposit" | "withdraw",
  amount?: string,
  token?: string
): Promise<T> => {
  const operationText = operation.charAt(0).toUpperCase() + operation.slice(1);
  const amountText = amount && token ? ` ${amount} ${token}` : "";
  
  return toast.promise(transactionPromise, {
    loadingMessage: `${operationText}ing${amountText}...`,
    successMessage: `${operationText}${amountText} successful!`,
    errorMessage: `${operationText} failed. Please try again.`,
  });
};

export const handleWalletConnection = async (
  connectionPromise: Promise<any>,
  walletName: string
): Promise<any> => {
  return toast.promise(connectionPromise, {
    loadingMessage: `Connecting to ${walletName}...`,
    successMessage: `Connected to ${walletName}!`,
    errorMessage: `Failed to connect to ${walletName}`,
  });
};

export const handleApproval = async (
  approvalPromise: Promise<any>,
  token: string
): Promise<any> => {
  return toast.promise(approvalPromise, {
    loadingMessage: `Approving ${token}...`,
    successMessage: `${token} approved!`,
    errorMessage: `Failed to approve ${token}`,
  });
};