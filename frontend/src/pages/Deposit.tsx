import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Wallet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { useVaultDeposit } from "../hooks/useVaultDeposit";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { toast } from "../hooks/useToastify";
import { VaultData } from "../types/api";
import { useVaults } from "../hooks/useVaults";

interface DepositPageProps {
  vault?: VaultData;
  onBack?: () => void;
}

const DepositPage = ({ vault }: DepositPageProps) => {
  const navigate = useNavigate();
  const { vaultAddress } = useParams();
  const [deposit0Amount, setDeposit0Amount] = useState("");
  const [deposit1Amount, setDeposit1Amount] = useState("");
  const [selectedToken, setSelectedToken] = useState<
    "token0" | "token1" | "both"
  >("both");

  // Fetch vaults data to get the actual vault information
  const { data: vaults, isLoading: vaultsLoading } = useVaults();

  // Find the current vault from the data - handle case-insensitive address matching
  const currentVault =
    vault ||
    (vaults && vaultAddress
      ? vaults.find(
          (v) => v.address?.toLowerCase() === vaultAddress?.toLowerCase()
        )
      : null) ||
    (vaults && vaults.length === 1 ? vaults[0] : null); // Use first vault if only one available

  const { depositToVault, loading, transactionStage, isConnected } =
    useVaultDeposit(currentVault || undefined);
  const { accountId } = useWalletInterface();

  // Debug logging
  console.log("=== VAULT DATA DEBUG ===");
  console.log("vaultAddress from params:", vaultAddress);
  console.log("vaults from API:", vaults);
  if (vaults && vaults.length > 0) {
    console.log("First vault structure:", vaults[0]);
    console.log(
      "Vault addresses available:",
      vaults.map((v) => ({ id: v.id, address: v.address }))
    );
    console.log("Looking for vaultAddress:", vaultAddress);
    console.log("Matching attempts:");
    vaults.forEach((v, i) => {
      console.log(`  Vault ${i}: id="${v.id}" address="${v.address}"`);
      console.log(`    address match: ${v.address === vaultAddress}`);
      console.log(
        `    address lowercase match: ${
          v.address?.toLowerCase() === vaultAddress?.toLowerCase()
        }`
      );
    });
  }
  console.log("currentVault found:", currentVault);
  console.log("vaultsLoading:", vaultsLoading);

  if (vaultsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">
            Loading vault data...
          </p>
        </div>
      </div>
    );
  }

  // If no vault data is available from backend, show error
  if (!currentVault && !vaultsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-mono mb-4">
            No vault data available from backend
          </p>
          <p className="text-muted-foreground font-mono text-sm">
            VaultAddress: {vaultAddress || "none"}
            <br />
            Available vaults: {vaults?.length || 0}
          </p>
          <Button onClick={() => navigate("/app")} className="mt-4">
            Back to Vaults
          </Button>
        </div>
      </div>
    );
  }

  // the backend vault data
  const displayVault = currentVault!;

  const handleBack = () => {
    navigate("/app");
  };

  // Handle tab switching with input clearing
  const handleTokenTypeChange = (newType: "token0" | "token1" | "both") => {
    const previousType = selectedToken;
    setSelectedToken(newType);

    // Clear inputs based on tab change logic
    if (newType === "token0" && previousType !== "token0") {
      // Switching to token0 only - clear token1 input
      console.log(
        `Clearing token1 input (switching to ${displayVault?.pool?.token0?.symbol} only)`
      );
      setDeposit1Amount("");
    } else if (newType === "token1" && previousType !== "token1") {
      // Switching to token1 only - clear token0 input
      console.log(
        `Clearing token0 input (switching to ${displayVault?.pool?.token1?.symbol} only)`
      );
      setDeposit0Amount("");
    } else {
      console.log("No input clearing needed");
    }
  };

  const handleDeposit = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if any amount is entered based on selected tab
    const hasValidAmount =
      (selectedToken === "token0" && deposit0Amount) ||
      (selectedToken === "token1" && deposit1Amount) ||
      (selectedToken === "both" && (deposit0Amount || deposit1Amount));

    if (!hasValidAmount) {
      toast.error("Please enter at least one deposit amount");
      return;
    }

    try {
      // Only send amounts that correspond to the selected tab
      const actualDeposit0Amount =
        selectedToken === "token0" || selectedToken === "both"
          ? deposit0Amount
          : "";
      const actualDeposit1Amount =
        selectedToken === "token1" || selectedToken === "both"
          ? deposit1Amount
          : "";

      console.log(`=== DEPOSIT AMOUNTS DEBUG ===`);
      console.log(`Selected tab: ${selectedToken}`);
      console.log(
        `Raw inputs - deposit0Amount: "${deposit0Amount}", deposit1Amount: "${deposit1Amount}"`
      );
      console.log(
        `Actual amounts being sent - actualDeposit0Amount: "${actualDeposit0Amount}", actualDeposit1Amount: "${actualDeposit1Amount}"`
      );

      const result = await depositToVault(
        actualDeposit0Amount,
        actualDeposit1Amount
      );
      if (result) {
        console.log("Deposit successful:", result);
        // Reset form on success
        setDeposit0Amount("");
        setDeposit1Amount("");

        // Show additional success information
        toast.success("Deposit completed!", 5000);
      }
    } catch (error: any) {
      console.error("Deposit failed:", error);

      // Check if it's a user cancellation - if so, don't show error
      const errorMessage = error?.message?.toLowerCase() || "";
      const isUserCancel =
        errorMessage.includes("transaction cancelled by user") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("user denied") ||
        error?.code === 4001 ||
        error?.code === "ACTION_REJECTED";

      if (!isUserCancel) {
        // Only show error for non-cancellation errors
        // Other errors are already handled by the hook's toast.promise/toast.transaction
        console.log("Non-cancellation error occurred:", error);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vaults
          </Button>
          <div className="flex-1">
            <h1 className="font-mono text-2xl md:text-3xl text-white">
              Deposit to Vault
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              {displayVault.name} • {displayVault.pool.token0.symbol}/
              {displayVault.pool.token1.symbol}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit Widget */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-xl text-white">Deposit</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    {displayVault.apy} APY
                  </div>
                </div>

                {/* Wallet Status */}
                {!isConnected ? (
                  <div className="space-y-4 p-4 bg-card/30 rounded-lg border border-border/50">
                    <div className="text-center">
                      <Wallet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4 font-mono">
                        Please connect your wallet to deposit
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-card/30 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground font-mono mb-1">
                      CONNECTED ACCOUNT
                    </div>
                    <div className="font-mono text-sm text-white">
                      {accountId}
                    </div>
                  </div>
                )}

                {/* Vault Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-card/30 rounded-lg border border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono mb-1">
                      VAULT TOKEN SUPPLY
                    </div>
                    <div className="font-mono text-lg text-white">
                      {displayVault.totalSupply
                        ? displayVault.totalSupply.toExponential(3)
                        : "0"}{" "}
                      {displayVault.symbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-mono mb-1">
                      FEE TIER
                    </div>
                    <div className="font-mono text-lg text-secondary">
                      {displayVault.pool.fee}%
                    </div>
                  </div>
                </div>

                {/* Token Selection */}
                <div>
                  <label className="block text-sm font-mono text-white mb-3">
                    Deposit Type
                  </label>
                  <div className="bg-card/20 rounded-lg p-1 border border-border">
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => handleTokenTypeChange("token0")}
                        className={`relative px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 border ${
                          selectedToken === "token0"
                            ? "bg-primary text-primary-foreground shadow-sm border-primary/50"
                            : "text-muted-foreground hover:text-white hover:bg-card/30 border-transparent hover:border-border/30"
                        }`}
                      >
                        {displayVault.pool.token0.symbol}
                      </button>
                      <button
                        onClick={() => handleTokenTypeChange("token1")}
                        className={`relative px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 border ${
                          selectedToken === "token1"
                            ? "bg-primary text-primary-foreground shadow-sm border-primary/50"
                            : "text-muted-foreground hover:text-white hover:bg-card/30 border-transparent hover:border-border/30"
                        }`}
                      >
                        {displayVault.pool.token1.symbol}
                      </button>
                      <button
                        onClick={() => handleTokenTypeChange("both")}
                        className={`relative px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 border ${
                          selectedToken === "both"
                            ? "bg-primary text-primary-foreground shadow-sm border-primary/50"
                            : "text-muted-foreground hover:text-white hover:bg-card/30 border-transparent hover:border-border/30"
                        }`}
                      >
                        Both
                      </button>
                    </div>
                  </div>
                </div>

                {/* Deposit Inputs */}
                <div className="space-y-4">
                  {(selectedToken === "token0" || selectedToken === "both") && (
                    <div>
                      <label className="block text-sm font-mono text-white mb-2">
                        {displayVault.pool.token0.symbol} Amount
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={deposit0Amount}
                        onChange={(e) => setDeposit0Amount(e.target.value)}
                        className="font-mono"
                        disabled={!isConnected}
                      />
                    </div>
                  )}

                  {(selectedToken === "token1" || selectedToken === "both") && (
                    <div>
                      <label className="block text-sm font-mono text-white mb-2">
                        {displayVault.pool.token1.symbol} Amount
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={deposit1Amount}
                        onChange={(e) => setDeposit1Amount(e.target.value)}
                        className="font-mono"
                        disabled={!isConnected}
                      />
                    </div>
                  )}
                </div>

                {/* Deposit Button */}
                <Button
                  onClick={handleDeposit}
                  disabled={
                    !isConnected ||
                    loading ||
                    !(
                      (selectedToken === "token0" && deposit0Amount) ||
                      (selectedToken === "token1" && deposit1Amount) ||
                      (selectedToken === "both" &&
                        (deposit0Amount || deposit1Amount))
                    )
                  }
                  className="w-full font-mono"
                  size="lg"
                >
                  {(() => {
                    if (loading) {
                      switch (transactionStage) {
                        case "approving":
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Approving Tokens...</span>
                            </div>
                          );
                        case "depositing":
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Submitting Deposit...</span>
                            </div>
                          );
                        case "confirming":
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Confirming Transaction...</span>
                            </div>
                          );
                        case "success":
                          return (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Deposit Complete!</span>
                            </div>
                          );
                        case "error":
                          return (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>Deposit Failed</span>
                            </div>
                          );
                        default:
                          return (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Processing...</span>
                            </div>
                          );
                      }
                    }
                    return "Deposit to Vault";
                  })()}
                </Button>
              </div>
            </Card>
          </div>

          {/* TVL Analytics */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-xl text-white">
                    Vault Analytics
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        displayVault.isActive ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    {displayVault.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Total Value Locked */}
                <div className="p-4 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-3 uppercase tracking-wide">
                    Total Value Locked
                  </div>

                  {/* Token Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-card/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={displayVault.pool.token0.image}
                          alt={displayVault.pool.token0.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                        <div>
                          <div className="font-mono text-sm text-white">
                            {displayVault.pool.token0.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {displayVault.pool.token0.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-white">
                          {typeof displayVault.tvl === "object" &&
                          displayVault.tvl.tvl0
                            ? displayVault.tvl.tvl0.toFixed(6)
                            : "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {typeof displayVault.tvl === "object" &&
                          displayVault.tvl.tvl0
                            ? `${displayVault.tvl.tvl0.toFixed(6)} ${
                                displayVault.pool.token0.symbol
                              }`
                            : "Amount not available"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={displayVault.pool.token1.image}
                          alt={displayVault.pool.token1.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                        <div>
                          <div className="font-mono text-sm text-white">
                            {displayVault.pool.token1.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {displayVault.pool.token1.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-white">
                          {typeof displayVault.tvl === "object" &&
                          displayVault.tvl.tvl1
                            ? displayVault.tvl.tvl1.toFixed(8)
                            : "--"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {typeof displayVault.tvl === "object" &&
                          displayVault.tvl.tvl1
                            ? `${displayVault.tvl.tvl1.toFixed(8)} ${
                                displayVault.pool.token1.symbol
                              }`
                            : "Amount not available"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Position Information */}
                <div className="p-4 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-3 uppercase tracking-wide">
                    Liquidity Position
                  </div>

                  {/* Price Range Visualization */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        Lower Tick
                      </span>
                      <span className="text-xs font-mono text-white">
                        {displayVault.lowerTick}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        Upper Tick
                      </span>
                      <span className="text-xs font-mono text-white">
                        {displayVault.upperTick}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        Current Tick
                      </span>
                      <span className="text-xs font-mono text-green-400">
                        {displayVault.pool.currentTick}
                      </span>
                    </div>

                    {/* Visual Range Indicator */}
                    <div className="relative h-2 bg-card/20 rounded-full mb-2">
                      <div
                        className="absolute h-full bg-primary/30 rounded-full"
                        style={{
                          left: "20%",
                          width: "60%",
                        }}
                      />
                      <div
                        className={`absolute w-1 h-4 rounded-full -top-1 ${
                          displayVault.pool.currentTick >=
                            displayVault.lowerTick &&
                          displayVault.pool.currentTick <=
                            displayVault.upperTick
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                        style={{
                          left: (() => {
                            const currentTick = displayVault.pool.currentTick;
                            const lowerTick = displayVault.lowerTick;
                            const upperTick = displayVault.upperTick;

                            // If current tick is below lower bound
                            if (currentTick < lowerTick) {
                              return "10%";
                            }
                            // If current tick is above upper bound
                            if (currentTick > upperTick) {
                              return "90%";
                            }
                            // If current tick is within range
                            const rangeWidth = upperTick - lowerTick;
                            const positionInRange = currentTick - lowerTick;
                            const percentage =
                              (positionInRange / rangeWidth) * 60 + 20;
                            return `${percentage}%`;
                          })(),
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>Min Price</span>
                      <span>Current</span>
                      <span>Max Price</span>
                    </div>
                  </div>

                  {/* Liquidity Amount */}
                </div>

                {/* Vault Metrics */}

                {/* Price Information */}
                <div className="p-4 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-3 uppercase tracking-wide">
                    Relative Prices
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <img
                          src={displayVault.pool.token0.image}
                          alt={displayVault.pool.token0.symbol}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {displayVault.pool.token0.symbol}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-white">
                        {displayVault.pool.price0?.toFixed(4) || "0.0000"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs {displayVault.pool.token1.symbol}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <img
                          src={displayVault.pool.token1.image}
                          alt={displayVault.pool.token1.symbol}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {displayVault.pool.token1.symbol}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-white">
                        {displayVault.pool.price1?.toFixed(4) || "0.0000"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs {displayVault.pool.token0.symbol}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fees Earned section removed - data not available in current backend response */}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
