import { useState, useEffect, useRef } from "react";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { WalletSelectionDialog } from "../components/WalletSelectionDialog";
import { TokenBalancesCard } from "../components/TokenBalancesCard";
import { Button } from "../components/ui/Button";
import {
  Bot,
  Send,
  Activity,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVaults } from "../hooks/useVaults";
import { useUserTokenBalances } from "../hooks/useUserTokenBalances";
import { useUserVaultShares } from "../hooks/useUserVaultShares";
import { useChat } from "../hooks/useChat";

// Mock activity feed
const mockActivities = [
  { id: 1, action: "🔍 Analyzing vault performance...", timestamp: new Date() },
  {
    id: 2,
    action: "⚡ Rebalancing HBAR/USDC position",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: 3,
    action: "📊 Fetching LP statistics",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: 4,
    action: "🎯 Optimizing yield strategies",
    timestamp: new Date(Date.now() - 120000),
  },
];

export default function App() {
  const navigate = useNavigate();
  const { accountId } = useWalletInterface();
  const [open, setOpen] = useState(false);

  // Fetch vault data from API
  const { data: vaults, isLoading, isError, error } = useVaults();

  // Fetch user token balances
  const {
    balances: tokenBalances,
    loading: balancesLoading,
    error: balancesError,
    refresh: refreshBalances,
  } = useUserTokenBalances(vaults);

  // Fetch user vault shares
  const {
    userShares,
    loading: sharesLoading,
    error: sharesError,
    refresh: refreshShares,
  } = useUserVaultShares(vaults);

  // Chat integration
  const {
    messages: chatMessages,
    isLoading: chatLoading,
    isTyping,
    error: chatError,
    sendMessage,
    clearMessages,
    retryMessage,
  } = useChat();

  const [inputMessage, setInputMessage] = useState("");
  const [activities, setActivities] = useState(mockActivities);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [chatMessages]);

  // Simulate live activity feed
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivities = [
        "Monitoring market conditions...",
        "Calculating optimal positions",
        "Executing rebalance strategy",
        "Tracking yield performance",
        "Adjusting liquidity ranges",
      ];

      const randomActivity =
        newActivities[Math.floor(Math.random() * newActivities.length)];
      setActivities((prev) => [
        { id: Date.now(), action: randomActivity, timestamp: new Date() },
        ...prev.slice(0, 4),
      ]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      await sendMessage(inputMessage);
      setInputMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      // Error is already handled by the chat hook
    }
  };

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="font-terminal text-xl text-glow-green">
              YIELDERA AI AGENT
            </h1>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            {/* Activity Feed */}
            <div className="relative neon-border bg-card/50 backdrop-blur-sm p-4 h-28 flex-shrink-0">
              <div className="absolute -top-3 left-4 bg-background px-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-terminal text-xs text-white uppercase tracking-wider">
                    ACTIVITY
                  </span>
                </div>
              </div>
              <div className="space-y-2 h-16 mt-2 overflow-hidden">
                {activities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between text-xs font-mono animate-slide-up"
                  >
                    <span className="text-white/80">{activity.action}</span>
                    <span className="text-accent">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Dialog */}
            <div className="relative neon-border bg-card/50 backdrop-blur-sm p-4 flex-1 min-h-0">
              <div className="absolute -top-3 left-4 bg-background px-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-secondary" />
                  <span className="font-terminal text-xs text-white uppercase tracking-wider">
                    DIALOG
                  </span>
                </div>
              </div>

              <div className="flex flex-col h-full mt-2">
                {/* Error banner */}
                {chatError && (
                  <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-red-200 flex-1">
                      {chatError}
                    </span>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Refresh page"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 cyber-scroll">
                  {/* Quick suggestions when chat is empty or just has welcome message */}
                  {chatMessages.length <= 1 && !isTyping && (
                    <div className="space-y-3 mb-4">
                      <div className="text-xs text-white/60 font-mono mb-2">
                        Try asking:
                      </div>
                      {["What's my HBAR balance?"].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInputMessage(suggestion);
                            // Auto-send after short delay for better UX
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          className="block w-full text-left text-xs font-mono text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded p-2 transition-all duration-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="relative group max-w-[80%]">
                        <div
                          className={`p-3 rounded-lg font-mono text-xs relative ${
                            message.type === "user"
                              ? message.status === "error"
                                ? "bg-red-500/20 border border-red-500/50 text-red-200"
                                : message.status === "sending"
                                ? "bg-primary/10 border border-primary/30 text-white/70"
                                : "bg-primary/20 border border-primary text-white"
                              : "bg-secondary/20 border border-secondary text-white"
                          }`}
                        >
                          {message.content}

                          {/* Loading indicator for sending messages */}
                          {message.status === "sending" && (
                            <div className="absolute -right-1 -bottom-1">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            </div>
                          )}

                          {/* Error indicator */}
                          {message.status === "error" && (
                            <div className="absolute -right-1 -bottom-1">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                            </div>
                          )}
                        </div>

                        {/* Retry button for failed messages */}
                        {message.status === "error" &&
                          message.type === "user" && (
                            <button
                              onClick={() => retryMessage(message.id)}
                              className="absolute -bottom-6 right-0 text-xs text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              Retry
                            </button>
                          )}

                        {/* Timestamp on hover */}
                        <div className="absolute -bottom-6 left-0 text-xs text-white/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-secondary/20 border border-secondary text-white p-3 rounded-lg font-mono text-xs relative">
                        <div className="flex items-center gap-2">
                          <span>AI is analyzing</span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-secondary rounded-full animate-bounce"></div>
                            <div
                              className="w-1 h-1 bg-secondary rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-secondary rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              </div>
            </div>

            {/* Prompt Input - Fixed at bottom */}
            <div className="relative neon-border bg-card/50 backdrop-blur-sm p-4 flex-shrink-0">
              <div className="absolute -top-3 left-4 bg-background px-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-accent" />
                  <span className="font-terminal text-xs text-white uppercase tracking-wider">
                    PROMPT
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <div className="flex-1 relative flex items-center">
                  <span className="font-mono text-white text-sm pointer-events-none mr-2">
                    {">"}
                  </span>
                  <div className="flex-1 relative">
                    <input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder=""
                      className="bg-transparent border-0 outline-0 text-white font-mono text-sm w-full placeholder:text-transparent focus:outline-0 focus:ring-0 focus:border-0 disabled:opacity-50"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      style={{ border: "none", boxShadow: "none" }}
                      autoComplete="off"
                      disabled={chatLoading}
                      maxLength={500}
                    />
                    {!inputMessage && !chatLoading && (
                      <span className="absolute left-0 top-0 text-white/50 font-mono text-sm animate-terminal-blink pointer-events-none">
                        _
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Character count */}
                  {inputMessage && (
                    <span className="text-xs text-white/40 font-mono">
                      {inputMessage.length}/500
                    </span>
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatLoading}
                    size="sm"
                    className="relative"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Helpful tips */}
              {!accountId && (
                <div className="mt-2 text-xs text-yellow-400/80 font-mono flex items-center gap-2">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>
                    Connect wallet for personalized portfolio insights
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Token Balances and Vaults */}
          <div className="flex flex-col space-y-4 h-full">
            {/* Token Balances Card */}
            <TokenBalancesCard
              balances={tokenBalances}
              loading={balancesLoading}
              error={balancesError}
              onRefresh={refreshBalances}
              isConnected={!!accountId}
            />

            {/* Loading State */}
            {isLoading && (
              <div className="relative neon-border bg-card/50 backdrop-blur-sm p-8 text-center flex-1 flex items-center justify-center">
                <div>
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-sm font-mono text-white/80">
                    Loading vaults...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="relative neon-border bg-card/50 backdrop-blur-sm p-8 text-center flex-1 flex items-center justify-center">
                <div>
                  <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
                  <p className="text-sm font-mono text-white/80 mb-2">
                    Failed to load vaults
                  </p>
                  <p className="text-xs font-mono text-white/60">
                    {error instanceof Error ? error.message : "Unknown error"}
                  </p>
                </div>
              </div>
            )}

            {/* Yieldera Vaults Card */}
            {vaults && vaults.length > 0 && (
              <div className="relative neon-border bg-card/50 backdrop-blur-sm p-4 flex-1">
                <div className="absolute -top-3 left-4 bg-background px-2">
                  <span className="font-terminal text-xs text-white uppercase tracking-wider">
                    Yieldera Vaults
                  </span>
                </div>
                <div className="space-y-4 mt-2 h-full overflow-y-auto cyber-scroll">
                  {vaults.map((vault, index) => {
                    // Find user shares for this vault
                    const userShare = userShares.find(
                      (share) => share.vaultAddress === vault.address
                    );
                    const hasShares =
                      userShare &&
                      parseFloat(userShare.shareBalanceFormatted) > 0;

                    return (
                      <div
                        key={vault.id}
                        className="border border-white/10 rounded-lg p-4 hover:border-primary/30 transition-all duration-300 group bg-background/20"
                      >
                        <div className="space-y-3">
                          {/* Vault Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                <img
                                  src={vault.pool.token0.image}
                                  alt={vault.pool.token0.symbol}
                                  className="w-6 h-6 rounded-full border border-primary/50"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMzOWZmMTQiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMGQwZDBkIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIj4/PC90ZXh0Pgo8L3N2Zz4K";
                                  }}
                                />
                                <img
                                  src={vault.pool.token1.image}
                                  alt={vault.pool.token1.symbol}
                                  className="w-6 h-6 rounded-full border border-secondary/50"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMwMGNjZmYiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMGQwZDBkIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIj4/PC90ZXh0Pgo8L3N2Zz4K";
                                  }}
                                />
                              </div>
                              <span className="font-mono text-sm text-white font-medium">
                                {vault.pool.token0.symbol}/
                                {vault.pool.token1.symbol}
                              </span>
                            </div>
                            <div
                              className={`px-2 py-1 rounded text-xs font-mono ${
                                vault.status === "SaucerSwap"
                                  ? "bg-primary/20 text-primary border border-primary/50"
                                  : vault.status === "Bonzo"
                                  ? "bg-accent/20 text-accent border border-accent/50"
                                  : "bg-secondary/20 text-secondary border border-secondary/50"
                              }`}
                            >
                              {vault.status}
                            </div>
                          </div>

                          {/* Vault Stats */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-white/60 font-mono">
                                TVL
                              </span>
                              <div className="text-right">
                                {typeof vault.tvl === "string" ? (
                                  <span className="text-sm font-mono text-white font-semibold">
                                    {vault.tvl}
                                  </span>
                                ) : vault.tvl &&
                                  typeof vault.tvl === "object" ? (
                                  <div className="space-y-1">
                                    <div className="text-xs font-mono text-white/80">
                                      {vault.pool.token0.symbol}:{" "}
                                      {parseFloat(
                                        vault.tvl.tvl0.toString()
                                      ).toFixed(2)}
                                    </div>
                                    <div className="text-xs font-mono text-white/80">
                                      {vault.pool.token1.symbol}:{" "}
                                      {parseFloat(
                                        vault.tvl.tvl1.toString()
                                      ).toFixed(2)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm font-mono text-white/60">
                                    --
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-white/60 font-mono">
                                APY
                              </span>
                              <span className="text-sm font-mono text-accent font-semibold">
                                {vault.apy}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-white/60 font-mono">
                                Fee
                              </span>
                              <span className="text-sm font-mono text-secondary font-semibold">
                                {vault.pool.fee}%
                              </span>
                            </div>
                          </div>

                          {/* My Shares Section */}
                          {accountId && (
                            <div className="border-t border-white/10 pt-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-primary font-mono">
                                  My Shares
                                </span>
                                <span
                                  className={`text-xs font-mono ${
                                    hasShares ? "text-primary" : "text-white/40"
                                  }`}
                                >
                                  {sharesLoading
                                    ? "..."
                                    : `${
                                        userShare?.shareBalanceFormatted ||
                                        "0.000000"
                                      } ${vault.symbol}`}
                                </span>
                              </div>
                              {hasShares && userShare && (
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/50 font-mono">
                                      {vault.pool.token0.symbol}
                                    </span>
                                    <span className="text-xs font-mono text-white/70">
                                      {userShare.token0Amount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/50 font-mono">
                                      {vault.pool.token1.symbol}
                                    </span>
                                    <span className="text-xs font-mono text-white/70">
                                      {userShare.token1Amount}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs flex items-center justify-center gap-1"
                              onClick={() =>
                                navigate(`/deposit/${vault.address}`)
                              }
                            >
                              <DollarSign className="w-3 h-3" />
                              Deposit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs flex items-center justify-center gap-1"
                              onClick={() =>
                                navigate(`/withdraw/${vault.address}`)
                              }
                              disabled={!hasShares}
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              Withdraw
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No vaults found */}
            {vaults && vaults.length === 0 && !isLoading && (
              <div className="relative neon-border bg-card/50 backdrop-blur-sm p-8 text-center flex-1 flex items-center justify-center">
                <div>
                  <TrendingUp className="w-8 h-8 mx-auto mb-4 text-white/40" />
                  <p className="text-sm font-mono text-white/80">
                    No vaults available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <WalletSelectionDialog
        open={open}
        setOpen={setOpen}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
