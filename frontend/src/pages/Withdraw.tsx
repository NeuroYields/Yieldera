import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { useVaultWithdraw } from "../hooks/useVaultWithdraw";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ethers } from "ethers";
import { toast } from "../hooks/useToastify";
import { VaultData, TOKEN_ICONS } from "../types/api";
import { useVaults } from "../hooks/useVaults";

interface WithdrawPageProps {
  vault?: VaultData;
  onBack?: () => void;
}

const WithdrawPage = ({ vault }: WithdrawPageProps) => {
  const navigate = useNavigate();
  const { vaultAddress } = useParams();
  const [shareAmount, setShareAmount] = useState("");
  const [withdrawPercentage, setWithdrawPercentage] = useState<number | null>(
    null
  );

  // Fetch vaults data to get the actual vault information
  const { data: vaults, isLoading: vaultsLoading } = useVaults();

  // Find the current vault from the data using the address from URL params
  const currentVault =
    vault ||
    (vaults && vaultAddress
      ? vaults.find(
          (v) => v.address.toLowerCase() === vaultAddress.toLowerCase()
        )
      : null);

  const {
    withdrawFromVault,
    fetchUserPosition,
    userPosition,
    vaultInfo,
    loading,
    loadingPosition,
    transactionStage,
    isConnected,
  } = useVaultWithdraw(currentVault || undefined);

  const { accountId } = useWalletInterface();

  // If no vault data is available, show loading or error state
  if (!currentVault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Vault Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load vault data. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const displayVault = currentVault;

  // Helper function to format currency from TVL string
  const formatCurrencyValue = (tvlString: string): string => {
    // Extract numeric value from strings like "$2.1M"
    const match = tvlString.match(/\$?([\d.]+)([KMB]?)/);
    if (match) {
      const [, value, unit] = match;
      const numValue = parseFloat(value);
      switch (unit) {
        case "K":
          return `$${(numValue * 1000).toLocaleString()}`;
        case "M":
          return `$${(numValue * 1000000).toLocaleString()}`;
        case "B":
          return `$${(numValue * 1000000000).toLocaleString()}`;
        default:
          return `$${numValue.toLocaleString()}`;
      }
    }
    return tvlString;
  };

  const handleBack = () => {
    navigate("/app");
  };

  const handlePercentageClick = (percentage: number) => {
    if (!userPosition) return;

    setWithdrawPercentage(percentage);

    // Use raw share balance
    const shareBalanceRaw = ethers.BigNumber.from(userPosition.shareBalance);
    const withdrawAmountRaw = shareBalanceRaw.mul(percentage).div(100);

    // Convert back to formatted amount for display
    const withdrawAmountFormatted = ethers.utils.formatEther(withdrawAmountRaw);

    console.log("=== PERCENTAGE CALCULATION ===");
    console.log("Percentage:", percentage);
    console.log("Raw share balance:", userPosition.shareBalance);
    console.log("Withdraw amount raw:", withdrawAmountRaw.toString());
    console.log("Withdraw amount formatted:", withdrawAmountFormatted);

    setShareAmount(withdrawAmountFormatted);
  };

  const handleMaxClick = () => {
    handlePercentageClick(100);
  };

  const handleShareAmountChange = (value: string) => {
    setShareAmount(value);
    setWithdrawPercentage(null);
  };

  const handleWithdraw = async () => {
    if (!shareAmount || !userPosition) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const result = await withdrawFromVault(shareAmount);
      if (result) {
        console.log("Withdrawal successful:", result);
        setShareAmount("");
        setWithdrawPercentage(null);

        toast.success(
          "Position updated! Check your wallet for received tokens.",
          5000
        );
      }
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
    }
  };

  const isValidWithdraw = () => {
    if (!shareAmount || !userPosition) return false;
    const amount = parseFloat(shareAmount);
    const maxAmount = parseFloat(userPosition.shareBalanceFormatted);
    return amount > 0 && amount <= maxAmount;
  };

  const getEstimatedReceive = () => {
    if (!shareAmount || !userPosition) return { token0: "0", token1: "0" };

    const shareAmountFloat = parseFloat(shareAmount);
    const shareBalanceFloat = parseFloat(userPosition.shareBalanceFormatted);

    // Prevent division by zero or very small numbers
    if (shareAmountFloat <= 0 || shareBalanceFloat <= 0) {
      return { token0: "0", token1: "0" };
    }

    const withdrawRatio = shareAmountFloat / shareBalanceFloat;

    // Prevent infinity calculations
    if (!isFinite(withdrawRatio) || withdrawRatio <= 0) {
      return { token0: "0", token1: "0" };
    }

    const token0Amount = (
      parseFloat(userPosition.token0Amount) * withdrawRatio
    ).toFixed(6);
    const token1Amount = (
      parseFloat(userPosition.token1Amount) * withdrawRatio
    ).toFixed(2);

    return { token0: token0Amount, token1: token1Amount };
  };

  const estimatedReceive = getEstimatedReceive();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-lg font-mono text-white">
                Withdraw from {displayVault.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Single Large Card */}
        <Card className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Vault Info & Position */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-mono text-white mb-4">
                Vault Information
              </h2>

              {/* Vault Header */}
              <div className="flex items-center space-x-3 p-3 bg-card/30 rounded-lg border border-border/50 mb-4">
                <img
                  src={displayVault.pool.token0.image}
                  alt={displayVault.pool.token0.symbol}
                  className="w-8 h-8 rounded-full"
                />
                <img
                  src={displayVault.pool.token1.image}
                  alt={displayVault.pool.token1.symbol}
                  className="w-8 h-8 rounded-full -ml-2"
                />
                <div>
                  <div className="font-mono text-sm text-white">
                    {displayVault.pool.token0.symbol}/
                    {displayVault.pool.token1.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {displayVault.name}
                  </div>
                </div>
              </div>

              {/* Vault Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    APY
                  </div>
                  <div className="font-mono text-sm text-green-400">
                    {displayVault.apy}
                  </div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    FEE
                  </div>
                  <div className="font-mono text-sm text-secondary">
                    {displayVault.pool.fee}%
                  </div>
                </div>
              </div>

              {/* Current Position */}
              {loadingPosition ? (
                <div className="p-3 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono">
                    Loading position...
                  </div>
                </div>
              ) : (
                userPosition && (
                  <div className="p-3 bg-card/30 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground font-mono mb-3">
                      YOUR POSITION
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Shares
                        </div>
                        <div className="font-mono text-sm text-white">
                          {userPosition.shareBalanceFormatted}{" "}
                          {vaultInfo?.symbol || "LP"}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/30">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {displayVault.pool.token0.symbol}:
                            </span>
                            <span className="text-white font-mono">
                              {userPosition.token0Amount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {displayVault.pool.token1.symbol}:
                            </span>
                            <span className="text-white font-mono">
                              {userPosition.token1Amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Right Column - Withdraw Form */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-mono text-white mb-4">
                Withdraw Shares
              </h2>

              {/* Wallet Connection Status */}
              {!isConnected ? (
                <div className="text-center py-8">
                  <div className="bg-muted/50 rounded-lg p-6">
                    <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3 font-mono">
                      Please connect your wallet to withdraw
                    </p>
                  </div>
                </div>
              ) : !userPosition && !loadingPosition ? (
                <div className="text-center py-8">
                  <div className="bg-muted/50 rounded-lg p-6">
                    <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3 font-mono">
                      No vault position found
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUserPosition}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Percentage Buttons */}
                  {userPosition && (
                    <div className="mb-6">
                      <label className="block text-xs font-mono text-white mb-3 uppercase tracking-wide">
                        Quick Withdraw
                      </label>
                      <div className="text-xs text-muted-foreground mb-3 font-mono">
                        Select a percentage of your position
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((percentage) => (
                          <Button
                            key={percentage}
                            variant={
                              withdrawPercentage === percentage
                                ? "primary"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => handlePercentageClick(percentage)}
                            className="text-xs font-mono h-9"
                          >
                            {percentage}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Share Amount Input */}
                  {userPosition && (
                    <div className="mb-6">
                      <label className="block text-xs font-mono text-white mb-3 uppercase tracking-wide">
                        LP Tokens to Withdraw
                      </label>
                      <div className="text-xs text-muted-foreground mb-3 font-mono">
                        Enter amount of LP tokens to withdraw
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.000000"
                          value={shareAmount}
                          onChange={(e) =>
                            handleShareAmountChange(e.target.value)
                          }
                          className="pr-16 h-10 text-sm font-mono"
                          step="0.000001"
                          min="0"
                          max={userPosition.shareBalanceFormatted}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMaxClick}
                            className="text-xs text-primary hover:text-primary-dark h-6 px-2 font-mono"
                          >
                            MAX
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground font-mono">
                        Available: {userPosition.shareBalanceFormatted}{" "}
                        {vaultInfo?.symbol || "LP"}
                      </div>
                    </div>
                  )}

                  {/* Estimated Receive */}
                  {shareAmount && userPosition && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/30">
                      <div className="text-xs text-muted-foreground font-mono mb-3 uppercase tracking-wide">
                        Estimated Receive
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <img
                              src={displayVault.pool.token0.image}
                              alt={displayVault.pool.token0.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {displayVault.pool.token0.symbol}:
                            </span>
                          </div>
                          <span className="text-sm font-mono text-white">
                            ~{estimatedReceive.token0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <img
                              src={displayVault.pool.token1.image}
                              alt={displayVault.pool.token1.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {displayVault.pool.token1.symbol}:
                            </span>
                          </div>
                          <span className="text-sm font-mono text-white">
                            ~{estimatedReceive.token1}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Withdraw Button */}
                  {userPosition && (
                    <Button
                      onClick={handleWithdraw}
                      disabled={!isValidWithdraw() || loading}
                      className="w-full h-10 text-sm font-mono"
                      size="md"
                    >
                      {(() => {
                        if (loading) {
                          switch (transactionStage) {
                            case "withdrawing":
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Preparing Withdrawal...</span>
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
                                  <span>Withdrawal Complete!</span>
                                </div>
                              );
                            case "error":
                              return (
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Withdrawal Failed</span>
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
                        return "Withdraw LP";
                      })()}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawPage;
