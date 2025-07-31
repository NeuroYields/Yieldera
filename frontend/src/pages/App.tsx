import React, { useState, useEffect, useRef } from "react";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { WalletSelectionDialog } from "../components/WalletSelectionDialog";
import { AccountId } from "@hashgraph/sdk";
import { Card } from "../components/ui/card2";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Bot,
  Send,
  Activity,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock vault data
const mockVaults = [
  {
    id: "vault1",
    name: "HBAR/USDC Vault",
    symbol: "yHBAR-USDC",
    address: "0.0.123456",
    pool: {
      token0: { symbol: "HBAR", image: "/images/whbar.png" },
      token1: { symbol: "USDC", image: "/images/tokens/usdc.png" },
      fee: 0.3,
      current_tick: 195420,
    },
    total_supply: 1250000,
    tvl: "$2.4M",
    apy: "24.5%",
    status: "SaucerSwap",
  },
  {
    id: "vault2",
    name: "SAUCE/HBAR Vault",
    symbol: "ySAUCE-HBAR",
    address: "0.0.789012",
    pool: {
      token0: { symbol: "SAUCE", image: "/images/tokens/sauce.webp" },
      token1: { symbol: "HBAR", image: "/images/whbar.png" },
      fee: 0.5,
      current_tick: 87650,
    },
    total_supply: 850000,
    tvl: "$1.8M",
    apy: "31.2%",
    status: "Bonzo",
  },
];

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

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}
export default function App() {
  const navigate = useNavigate();
  const { walletInterface, accountId } = useWalletInterface();
  const [open, setOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Welcome to Yieldera! I'm your AI liquidity manager. How can I help optimize your DeFi yields today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activities, setActivities] = useState(mockActivities);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "I'm analyzing the current market conditions for optimal yield opportunities. Based on recent data, I recommend focusing on the HBAR/USDC vault which is showing strong performance.",
        "Your portfolio is performing well! The AI has automatically rebalanced your positions 3 times today to maximize yields while minimizing impermanent loss.",
        "I've detected a new arbitrage opportunity. Would you like me to execute a position adjustment to capture additional yield?",
        "Current market volatility is within acceptable parameters. Your risk-adjusted returns are outperforming the market by 12.3%.",
      ];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleConnect = () => {
    if (accountId) {
      // Already connected, could show disconnect option
      return;
    }
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-background p-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            {/* Activity Feed */}
            <div className="relative neon-border bg-card/50 backdrop-blur-sm p-4 h-48 flex-shrink-0">
              <div className="absolute -top-3 left-4 bg-background px-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-terminal text-xs text-white uppercase tracking-wider">
                    ACTIVITY
                  </span>
                </div>
              </div>
              <div className="space-y-2 overflow-y-auto h-36 mt-2">
                {activities.map((activity) => (
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
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 cyber-scroll">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg font-mono text-xs ${
                          message.type === "user"
                            ? "bg-primary/20 border border-primary text-white"
                            : "bg-secondary/20 border border-secondary text-white"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-secondary/20 border border-secondary text-white p-3 rounded-lg font-mono text-xs">
                        <span className="animate-pulse">AI is typing...</span>
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
                      className="bg-transparent border-0 outline-0 text-white font-mono text-sm w-full placeholder:text-transparent focus:outline-0 focus:ring-0 focus:border-0"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      style={{ border: "none", boxShadow: "none" }}
                      autoComplete="off"
                    />
                    {!inputMessage && (
                      <span className="absolute left-0 top-0 text-white/50 font-mono text-sm animate-terminal-blink pointer-events-none">
                        _
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Vaults */}
          <div className="space-y-4">
            {mockVaults.map((vault, index) => (
              <div
                key={vault.id}
                className="relative neon-border bg-card/50 backdrop-blur-sm p-4 hover:shadow-neon-green transition-all duration-300 group"
              >
                <div className="absolute -top-3 left-4 bg-background px-2">
                  <span className="font-terminal text-xs text-white uppercase tracking-wider">
                    VAULT{index + 1}
                  </span>
                </div>
                <div className="space-y-3 mt-2">
                  {/* Vault Status */}
                  <div className="flex justify-end">
                    <div
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        vault.status === "SaucerSwap"
                          ? "bg-primary/20 text-primary border border-primary/50"
                          : "bg-accent/20 text-accent border border-accent/50"
                      }`}
                    >
                      {vault.status}
                    </div>
                  </div>

                  {/* Token Pair */}
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
                      {vault.pool.token0.symbol}/{vault.pool.token1.symbol}
                    </span>
                  </div>

                  {/* Vault Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60 font-mono">
                        TVL
                      </span>
                      <span className="text-sm font-mono text-white font-semibold">
                        {vault.tvl}
                      </span>
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

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs flex items-center justify-center gap-1"
                      onClick={() => navigate(`/deposit/${vault.address}`)}
                    >
                      <DollarSign className="w-3 h-3" />
                      Deposit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs flex items-center justify-center gap-1"
                      onClick={() => navigate(`/withdraw/${vault.address}`)}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
