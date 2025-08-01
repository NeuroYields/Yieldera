import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";
import MetamaskLogo from "../assets/metamask-logo.svg";
import WalletConnectLogo from "../assets/walletconnect-logo.svg";

interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: () => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

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
              className="w-full cyber-button flex items-center justify-center space-x-3 py-4 group"
              onClick={() => {
                openWalletConnectModal();
                setOpen(false);
              }}
            >
              <img
                src={WalletConnectLogo}
                alt="WalletConnect logo"
                className="w-6 h-6 group-hover:scale-110 transition-transform duration-200"
              />
              <span>WalletConnect</span>
            </button>

            <button
              className="w-full cyber-button flex items-center justify-center space-x-3 py-4 group"
              onClick={() => {
                connectToMetamask();
                setOpen(false);
              }}
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
