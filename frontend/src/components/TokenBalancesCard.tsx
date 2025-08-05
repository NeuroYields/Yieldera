import React from "react";
import { Wallet, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";
import { TokenBalance } from "../hooks/useUserTokenBalances";
import { TOKEN_ICONS } from "../types/api";

interface TokenBalancesCardProps {
  balances: TokenBalance[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isConnected: boolean;
}

export const TokenBalancesCard: React.FC<TokenBalancesCardProps> = ({
  balances,
  loading,
  error,
  onRefresh,
  isConnected,
}) => {
  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.001) return "< 0.001";
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(3);
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
    return `${(num / 1000000).toFixed(2)}M`;
  };

  const getTokenIcon = (symbol: string, isNativeWrapper: boolean) => {
    // Use your existing TOKEN_ICONS mapping
    const tokenKey = isNativeWrapper ? "HBAR" : symbol;
    return (
      TOKEN_ICONS[tokenKey] ||
      `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMzOWZmMTQiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMGQwZDBkIiBmb250LXNpemU9IjgiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPiR7c3ltYm9sLnN1YnN0cmluZygwLCAzKX08L3RleHQ+Cjwvc3ZnPgo=`
    );
  };

  if (!isConnected) {
    return (
      <div className="relative neon-border bg-card/50 backdrop-blur-sm p-6 text-center">
        <div className="absolute -top-3 left-4 bg-background px-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" />
            <span className="font-terminal text-xs text-white uppercase tracking-wider">
              TOKEN BALANCES
            </span>
          </div>
        </div>
        <Wallet className="w-8 h-8 mx-auto mb-4 text-white/40" />
        <p className="text-sm font-mono text-white/80">
          Connect wallet to view balances
        </p>
      </div>
    );
  }

  return (
    <div className="relative neon-border bg-card/50 backdrop-blur-sm p-4">
      <div className="absolute -top-3 left-4 bg-background px-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-accent" />
          <span className="font-terminal text-xs text-white uppercase tracking-wider">
            TOKEN BALANCES
          </span>
        </div>
      </div>

      <div className="space-y-3 mt-2">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-white/60">Your Holdings</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            className="p-1 h-6 w-6"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-xs font-mono text-white/80">
              Loading balances...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono text-red-400">
              Failed to load balances
            </span>
          </div>
        )}

        {/* Token Balances */}
        {!loading && !error && balances.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto cyber-scroll">
            {balances.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={getTokenIcon(token.symbol, token.isNativeWrapper)}
                    alt={token.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = getTokenIcon(
                        token.symbol,
                        token.isNativeWrapper
                      );
                    }}
                  />
                  <div>
                    <div className="text-xs font-mono text-white font-medium">
                      {token.symbol}
                    </div>
                    {token.isNativeWrapper && (
                      <div className="text-xs font-mono text-accent">
                        Native
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-white font-semibold">
                    {formatBalance(token.balanceFormatted)}
                  </div>
                  <div className="text-xs font-mono text-white/60">
                    {token.symbol}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Balances */}
        {!loading && !error && balances.length === 0 && (
          <div className="text-center py-4">
            <Wallet className="w-6 h-6 mx-auto mb-2 text-white/40" />
            <p className="text-xs font-mono text-white/60">
              No token balances found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
