import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card2";
import { Bot, Shield, TrendingUp, Clock, Cpu, Vault } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-POWERED OPTIMIZATION",
      description:
        "Advanced machine learning algorithms continuously analyze market conditions and optimize your liquidity positions for maximum yield.",
      color: "text-primary",
    },
    {
      icon: Clock,
      title: "24/7 AUTOMATED MANAGEMENT",
      description:
        "Never miss an opportunity. Our AI works around the clock, automatically rebalancing and optimizing your portfolio while you sleep.",
      color: "text-secondary",
    },
    {
      icon: Shield,
      title: "RISK MITIGATION",
      description:
        "Smart risk assessment protocols protect your assets by automatically adjusting positions based on market volatility and impermanent loss calculations.",
      color: "text-accent",
    },
    {
      icon: TrendingUp,
      title: "YIELD MAXIMIZATION",
      description:
        "Intelligent yield farming strategies that automatically move your liquidity to the highest-performing pools across multiple DEXs.",
      color: "text-primary",
    },
    {
      icon: Vault,
      title: "SMART VAULT SYSTEM",
      description:
        "Automated LP process with position rebalancing, auto-compounding fees, and single-sided deposits. Receive fungible YVHBAR tokens as vault receipts for additional DeFi opportunities.",
      color: "text-secondary",
    },
    {
      icon: Cpu,
      title: "HEDERA NATIVE",
      description:
        "Built specifically for Hedera's high-speed, low-cost infrastructure. Benefit from sub-second finality and minimal transaction fees.",
      color: "text-accent",
    },
    // {
    //   icon: Zap,
    //   title: "INSTANT EXECUTION",
    //   description:
    //     "Lightning-fast trade execution leveraging Hedera's consensus algorithm ensures you capture opportunities the moment they arise.",
    //   color: "text-accent",
    // },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-terminal text-3xl md:text-4xl text-glow-green mb-4">
            FEATURES
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            Revolutionizing DeFi with artificial intelligence and automated
            liquidity management
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="neon-border bg-card/50 backdrop-blur-sm hover:shadow-neon-green transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  <CardTitle className="font-terminal text-sm">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed text-white">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics */}
        {/* <div className="mt-20 text-center">
          <h3 className="font-terminal text-2xl text-glow-blue mb-8">
            PERFORMANCE METRICS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-terminal text-primary mb-2 neon-pulse">
                15.7%
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                AVG APY
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-terminal text-secondary mb-2">
                99.9%
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                UPTIME
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-terminal text-accent mb-2">
                $2.1M
              </div>
              <div className="text-sm text-muted-foreground font-mono">TVL</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-terminal text-primary mb-2">
                847
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                USERS
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default Features;
