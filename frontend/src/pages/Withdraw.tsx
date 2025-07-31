import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Info, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { useVaultWithdraw } from "../hooks/useVaultWithdraw";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { YIELDERA_CONTRACT_ADDRESS } from "../config/constants";
import { ethers } from "ethers";

interface VaultDetails {
  address: string;
  name: string;
  symbol: string;
  token0: {
    symbol: string;
    name: string;
    image?: string;
  };
  token1: {
    symbol: string;
    name: string;
    image?: string;
  };
  currentTVL: number;
  apy: number;
  fee: number;
}

interface WithdrawPageProps {
  vault?: VaultDetails;
  onBack?: () => void;
}

const WithdrawPage = ({ vault, onBack }: WithdrawPageProps) => {
  const navigate = useNavigate();
  const [shareAmount, setShareAmount] = useState("");
  const [withdrawPercentage, setWithdrawPercentage] = useState<number | null>(
    null
  );

  const {
    withdrawFromVault,
    fetchUserPosition,
    userPosition,
    vaultInfo,
    loading,
    loadingPosition,
    error,
    isConnected,
  } = useVaultWithdraw();

  const { accountId } = useWalletInterface();

  const currentVault = vault || {
    address: YIELDERA_CONTRACT_ADDRESS,
    name: "Yieldera Vault WHBAR",
    symbol: "LP",
    token0: {
      symbol: "WHBAR",
      name: "Wrapped HBAR",
      image: "/images/tokens/whbar.png",
    },
    token1: {
      symbol: "SAUCE",
      name: "Sauce Token",
      image: "/images/tokens/sauce.webp",
    },
    currentTVL: 2100000,
    apy: 15.7,
    fee: 0.3,
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/app");
    }
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
    if (!shareAmount || !userPosition) return;

    try {
      const result = await withdrawFromVault(shareAmount);
      if (result) {
        // Show success message or redirect
        console.log("Withdrawal successful:", result);
        // Reset form
        setShareAmount("");
        setWithdrawPercentage(null);
      }
    } catch (error) {
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

    const withdrawRatio =
      parseFloat(shareAmount) / parseFloat(userPosition.shareBalanceFormatted);
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
                Withdraw from {currentVault.name}
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
                  src={currentVault.token0.image}
                  alt={currentVault.token0.symbol}
                  className="w-8 h-8 rounded-full"
                />
                <img
                  src={currentVault.token1.image}
                  alt={currentVault.token1.symbol}
                  className="w-8 h-8 rounded-full -ml-2"
                />
                <div>
                  <div className="font-mono text-sm text-white">
                    {currentVault.token0.symbol}/{currentVault.token1.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentVault.name}
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
                    {currentVault.apy}%
                  </div>
                </div>
                <div className="p-3 bg-card/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground font-mono mb-1">
                    FEE
                  </div>
                  <div className="font-mono text-sm text-secondary">
                    {currentVault.fee}%
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
                              {currentVault.token0.symbol}:
                            </span>
                            <span className="text-white font-mono">
                              {userPosition.token0Amount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {currentVault.token1.symbol}:
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
                              src={currentVault.token0.image}
                              alt={currentVault.token0.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {currentVault.token0.symbol}:
                            </span>
                          </div>
                          <span className="text-sm font-mono text-white">
                            ~{estimatedReceive.token0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <img
                              src={currentVault.token1.image}
                              alt={currentVault.token1.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {currentVault.token1.symbol}:
                            </span>
                          </div>
                          <span className="text-sm font-mono text-white">
                            ~{estimatedReceive.token1}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center text-xs text-destructive font-mono">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {error}
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
                      {loading
                        ? "Withdrawing..."
                        : `Withdraw ${vaultInfo?.symbol || "LP"}`}
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
