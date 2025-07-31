import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
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
import { YIELDERA_CONTRACT_ADDRESS } from "../config/constants";
import { toast } from "../hooks/useToastify";

// Mock TVL data for chart
const tvlData = [
  { date: "Jan 1", tvl: 850000, timestamp: "2025-01-01" },
  { date: "Jan 7", tvl: 920000, timestamp: "2025-01-07" },
  { date: "Jan 14", tvl: 1100000, timestamp: "2025-01-14" },
  { date: "Jan 21", tvl: 1350000, timestamp: "2025-01-21" },
  { date: "Jan 28", tvl: 1580000, timestamp: "2025-01-28" },
  { date: "Feb 4", tvl: 1750000, timestamp: "2025-02-04" },
  { date: "Feb 11", tvl: 1920000, timestamp: "2025-02-11" },
  { date: "Feb 18", tvl: 2100000, timestamp: "2025-02-18" },
];

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

interface DepositPageProps {
  vault?: VaultDetails;
  onBack?: () => void;
}

const DepositPage = ({ vault }: DepositPageProps) => {
  const navigate = useNavigate();
  const [deposit0Amount, setDeposit0Amount] = useState("");
  const [deposit1Amount, setDeposit1Amount] = useState("");
  const [selectedToken, setSelectedToken] = useState<
    "token0" | "token1" | "both"
  >("both");

  const { depositToVault, loading, transactionStage, isConnected } =
    useVaultDeposit();
  const { accountId } = useWalletInterface();

  const currentVault = vault || {
    address: YIELDERA_CONTRACT_ADDRESS,
    name: "Yieldera Vault Hbar",
    symbol: "YHbar",
    token0: {
      symbol: "HBAR",
      name: "Hedera Hashgraph",
      image: "/images/tokens/hbar.png",
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
    navigate("/app");
  };

  const handleDeposit = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!deposit0Amount && !deposit1Amount) {
      toast.error("Please enter at least one deposit amount");
      return;
    }

    try {
      const result = await depositToVault(deposit0Amount, deposit1Amount);
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
      // Error toast is already handled by the hook's toast.promise/toast.transaction
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
              {currentVault.name} • {currentVault.token0.symbol}/
              {currentVault.token1.symbol}
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
                    {currentVault.apy}% APY
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
                      CURRENT TVL
                    </div>
                    <div className="font-mono text-lg text-white">
                      {formatCurrency(currentVault.currentTVL)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-mono mb-1">
                      FEE TIER
                    </div>
                    <div className="font-mono text-lg text-secondary">
                      {currentVault.fee}%
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
                        onClick={() => setSelectedToken("token0")}
                        className={`relative px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 border ${
                          selectedToken === "token0"
                            ? "bg-primary text-primary-foreground shadow-sm border-primary/50"
                            : "text-muted-foreground hover:text-white hover:bg-card/30 border-transparent hover:border-border/30"
                        }`}
                      >
                        {currentVault.token0.symbol}
                      </button>
                      <button
                        onClick={() => setSelectedToken("token1")}
                        className={`relative px-3 py-2 text-xs font-mono rounded-md transition-all duration-200 border ${
                          selectedToken === "token1"
                            ? "bg-primary text-primary-foreground shadow-sm border-primary/50"
                            : "text-muted-foreground hover:text-white hover:bg-card/30 border-transparent hover:border-border/30"
                        }`}
                      >
                        {currentVault.token1.symbol}
                      </button>
                      <button
                        onClick={() => setSelectedToken("both")}
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
                        {currentVault.token0.symbol} Amount
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
                        {currentVault.token1.symbol} Amount
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
                    (!deposit0Amount && !deposit1Amount)
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

          {/* TVL Chart */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-xl text-white">
                    TVL Analytics
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    30D Growth
                  </div>
                </div>

                {/* Current TVL Display */}
                <div className="text-center py-4">
                  <div className="text-3xl font-mono text-white mb-2">
                    {formatCurrency(currentVault.currentTVL)}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    Total Value Locked
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-mono text-sm">
                      +147% (30d)
                    </span>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-64">
                  {/* Mock Chart Visualization */}
                  <div className="h-full bg-card/20 rounded-lg border border-border/30 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-end justify-around p-4">
                      {tvlData.map((point, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className="w-8 bg-gradient-to-t from-primary/80 to-primary/20 rounded-t-sm"
                            style={{
                              height: `${
                                (point.tvl /
                                  Math.max(...tvlData.map((d) => d.tvl))) *
                                180
                              }px`,
                            }}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {point.date.split(" ")[1]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-4 left-4 text-xs text-muted-foreground font-mono">
                      TVL Growth Chart
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-card/30 rounded-lg border border-border/50 text-center">
                    <div className="text-lg font-mono text-white">24h</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Volume
                    </div>
                    <div className="text-sm font-mono text-white mt-1">
                      $125.6K
                    </div>
                  </div>
                  <div className="p-3 bg-card/30 rounded-lg border border-border/50 text-center">
                    <div className="text-lg font-mono text-white">156</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Depositors
                    </div>
                    <div className="text-sm font-mono text-white mt-1">
                      +12 today
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
