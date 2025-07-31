import React from "react";
import { toast as reactToastify, Id } from "react-toastify";

interface AsyncToastOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  autoClose?: number | false;
}

interface TransactionToastOptions extends AsyncToastOptions {
  txHash?: string;
  explorerUrl?: string;
}

export const toast = {
  success: (message: string, autoClose: number | false = 5000) => {
    reactToastify.success(message, { autoClose });
  },
  error: (message: string, autoClose: number | false = 7000) => {
    reactToastify.error(message, { autoClose });
  },
  info: (message: string, autoClose: number | false = 5000) => {
    reactToastify.info(message, { autoClose });
  },
  warning: (message: string, autoClose: number | false = 5000) => {
    reactToastify.warning(message, { autoClose });
  },
  loading: (message: string): Id => {
    return reactToastify.info(
      React.createElement(
        "div",
        { className: "flex items-center gap-2" },
        React.createElement("div", {
          className:
            "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin",
        }),
        React.createElement(
          "span",
          { className: "text-sm font-medium" },
          message
        )
      ),
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
        closeOnClick: false,
        hideProgressBar: true,
      }
    );
  },
  promise: async <T>(
    promise: Promise<T>,
    options: AsyncToastOptions
  ): Promise<T> => {
    const toastId = toast.loading(options.loadingMessage || "Processing...");

    try {
      const result = await promise;
      reactToastify.update(toastId, {
        render: options.successMessage || "Success!",
        type: "success",
        autoClose: options.autoClose ?? 5000,
        closeButton: true,
        draggable: true,
        closeOnClick: true,
        hideProgressBar: false,
      });
      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An error occurred";
      reactToastify.update(toastId, {
        render: options.errorMessage || errorMsg,
        type: "error",
        autoClose: options.autoClose ?? 7000,
        closeButton: true,
        draggable: true,
        closeOnClick: true,
        hideProgressBar: false,
      });
      throw error;
    }
  },
  transaction: async <T>(
    promise: Promise<T>,
    options: TransactionToastOptions
  ): Promise<T> => {
    const toastId = toast.loading(
      options.loadingMessage || "Processing transaction..."
    );

    try {
      const result = await promise;

      //success message with transaction link if hash is provided
      const successContent = options.txHash
        ? React.createElement(
            "div",
            { className: "flex flex-col gap-1" },
            React.createElement(
              "span",
              { className: "font-medium" },
              options.successMessage || "Transaction successful!"
            ),
            React.createElement(
              "a",
              {
                href:
                  options.explorerUrl ||
                  `https://hashscan.io/testnet/transaction/${options.txHash}`,
                target: "_blank",
                rel: "noopener noreferrer",
                className:
                  "text-xs text-blue-400 hover:text-blue-300 underline",
              },
              "View on Explorer"
            )
          )
        : options.successMessage || "Transaction successful!";

      reactToastify.update(toastId, {
        render: successContent,
        type: "success",
        autoClose: options.autoClose ?? 8000,
        closeButton: true,
        draggable: true,
        closeOnClick: true,
        hideProgressBar: false,
      });
      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Transaction failed";
      reactToastify.update(toastId, {
        render: options.errorMessage || errorMsg,
        type: "error",
        autoClose: options.autoClose ?? 7000,
        closeButton: true,
        draggable: true,
        closeOnClick: true,
        hideProgressBar: false,
      });
      throw error;
    }
  },
  update: (id: Id, options: any) => {
    reactToastify.update(id, options);
  },
  dismiss: (id?: Id) => {
    reactToastify.dismiss(id);
  },
};

export const useToast = () => {
  return { toast };
};
