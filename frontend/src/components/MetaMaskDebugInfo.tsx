import React, { useState, useEffect } from "react";
import {
  checkMetaMaskInstallation,
  checkMetaMaskConnection,
} from "../utils/metamaskHelpers";
import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";

const MetaMaskDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    isInstalled: false,
    isConnected: false,
    accounts: [] as string[],
    chainId: null as string | null,
    error: null as string | null,
  });

  const updateDebugInfo = async () => {
    try {
      const { ethereum } = window as any;

      const isInstalled = checkMetaMaskInstallation(false);
      const isConnected = await checkMetaMaskConnection();

      let accounts: string[] = [];
      let chainId: string | null = null;

      if (ethereum && isInstalled) {
        try {
          accounts = await ethereum.request({ method: "eth_accounts" });
          chainId = await ethereum.request({ method: "eth_chainId" });
        } catch (error: any) {
          console.error("Error getting MetaMask info:", error);
        }
      }

      setDebugInfo({
        isInstalled,
        isConnected,
        accounts,
        chainId,
        error: null,
      });
    } catch (error: any) {
      setDebugInfo((prev) => ({
        ...prev,
        error: error.message || "Unknown error",
      }));
    }
  };

  const handleConnect = async () => {
    try {
      await connectToMetamask();
      await updateDebugInfo();
    } catch (error: any) {
      console.error("Connection failed:", error);
      setDebugInfo((prev) => ({
        ...prev,
        error: error.message || "Connection failed",
      }));
    }
  };

  useEffect(() => {
    updateDebugInfo();
  }, []);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg m-4 max-w-md">
      <h3 className="text-lg font-bold mb-3">MetaMask Debug Info</h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Installed:</strong>
          <span
            className={
              debugInfo.isInstalled
                ? "text-green-400 ml-2"
                : "text-red-400 ml-2"
            }
          >
            {debugInfo.isInstalled ? "✅ Yes" : "❌ No"}
          </span>
        </div>

        <div>
          <strong>Connected:</strong>
          <span
            className={
              debugInfo.isConnected
                ? "text-green-400 ml-2"
                : "text-red-400 ml-2"
            }
          >
            {debugInfo.isConnected ? "✅ Yes" : "❌ No"}
          </span>
        </div>

        <div>
          <strong>Chain ID:</strong>
          <span className="ml-2">{debugInfo.chainId || "Not available"}</span>
        </div>

        <div>
          <strong>Accounts:</strong>
          <span className="ml-2">{debugInfo.accounts.length || "0"}</span>
        </div>

        {debugInfo.accounts.length > 0 && (
          <div className="text-xs break-all">
            <strong>Current Account:</strong>
            <br />
            {debugInfo.accounts[0]}
          </div>
        )}

        {debugInfo.error && (
          <div className="text-red-400 text-xs break-words">
            <strong>Error:</strong>
            <br />
            {debugInfo.error}
          </div>
        )}
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={updateDebugInfo}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Refresh
        </button>
        <button
          onClick={handleConnect}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          disabled={!debugInfo.isInstalled}
        >
          Connect
        </button>
      </div>
    </div>
  );
};

export default MetaMaskDebugInfo;
