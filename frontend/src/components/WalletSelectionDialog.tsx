import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";
import MetamaskLogo from "../assets/metamask-logo.svg";
import WalletConnectLogo from "../assets/walletconnect-logo.svg";
import { toast } from "../hooks/useToastify";

interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: () => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  if (!open) return null;

  const handleMetaMaskConnect = async () => {
    try {
      setOpen(false);
      await connectToMetamask();
    } catch (error: any) {
      console.error("MetaMask connection failed:", error);
      // Error is already handled in connectToMetamask function
    }
  };

  const handleWalletConnectModal = async () => {
    try {
      setOpen(false);
      await openWalletConnectModal();
    } catch (error: any) {
      console.error("WalletConnect connection failed:", error);
      const errorMessage =
        error?.message || error?.reason || "Unknown error occurred";
      toast.error(`Failed to connect to WalletConnect: ${errorMessage}`);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-cyber-black border-2 border-green-500 rounded-lg p-6 w-full max-w-md shadow-2xl shadow-green-500/20 animate-pulse-border">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-cyber-green font-retro text-sm text-glow-sm">
              Select Wallet
            </h2>
            <button
              onClick={onClose}
              className="text-cyber-green hover:text-green-400 transition-colors duration-200 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Wallet Options */}
          <div className="space-y-3">
            <button
              className="w-full cyber-button-disabled flex items-center justify-between px-4 py-4 cursor-not-allowed opacity-50"
              disabled
            >
              <div className="flex items-center space-x-3">
                <img
                  src={WalletConnectLogo}
                  alt="WalletConnect logo"
                  className="w-6 h-6 opacity-60"
                />
                <span>WalletConnect</span>
              </div>
              <span className="text-xs bg-cyber-green text-cyber-black px-2 py-1 rounded font-retro">
                SOON
              </span>
            </button>

            <button
              className="w-full cyber-button flex items-center justify-center space-x-3 py-4 group"
              onClick={handleMetaMaskConnect}
            >
              <img
                src={MetamaskLogo}
                alt="MetaMask logo"
                className="w-6 h-6 group-hover:scale-110 transition-transform duration-200"
              />
              <span>MetaMask</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-green-400 font-retro text-xs opacity-70">
              Choose your preferred wallet
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
