import { Card, CardContent, CardHeader, CardTitle } from "./ui/card2";
import { Users, Zap, TrendingUp, Shield } from "lucide-react";

const ProblemSolutionSection = () => {
  const problemSolutions = [
    {
      category: "For Novice Users",
      icon: Users,
      solution: "AI-Powered Automated Liquidity Manager",
      items: [
        {
          problem: "Complexity of the DeFi ecosystem",
          solution:
            "Simplifies the user experience through intelligent automation and smart UI",
        },
        {
          problem: "Lack of technical knowledge",
          solution:
            "Abstracts away technical jargon and decision-making using AI recommendations",
        },
        {
          problem: "Risk of losses",
          solution:
            "AI minimizes risk by optimizing strategies based on real-time market data",
        },
        {
          problem: "Fragmented information",
          solution:
            "Aggregates and analyzes data across protocols for a unified view",
        },
      ],
    },
    {
      category: "For Experienced Users",
      icon: Zap,
      solution: "Agentic Liquidity – Always-On Yield Optimization",
      items: [
        {
          problem: "Inefficient manual monitoring",
          solution: "Continuously scans and rebalances across protocols 24/7",
        },
        {
          problem: "Missed opportunities",
          solution:
            "AI detects and reacts to high-yield or arbitrage opportunities instantly",
        },
        {
          problem: "Complex comparative analysis",
          solution:
            "Automates the comparison of protocols, APYs, risks, and more",
        },
        {
          problem: "Lack of automation",
          solution:
            "Provides fully autonomous, data-driven liquidity management",
        },
      ],
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-terminal text-3xl md:text-4xl text-glow-green mb-4">
            PROBLEMS WE SOLVE
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            Yieldera addresses the key challenges faced by both novice and
            experienced DeFi users
          </p>
        </div>

        {/* Problem-Solution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {problemSolutions.map((category, categoryIndex) => (
            <Card
              key={categoryIndex}
              className="neon-border bg-card/50 backdrop-blur-sm hover:shadow-neon-green transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${categoryIndex * 0.2}s` }}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <category.icon className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle className="font-terminal text-lg text-glow-blue">
                      {category.category}
                    </CardTitle>
                    <p className="text-sm text-secondary font-mono mt-1">
                      {category.solution}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="border-l-2 border-primary/30 pl-4 animate-slide-up"
                      style={{
                        animationDelay: `${
                          categoryIndex * 0.2 + itemIndex * 0.1
                        }s`,
                      }}
                    >
                      <div className="mb-2">
                        <span className="text-sm font-mono text-muted-foreground">
                          Problem:
                        </span>
                        <p className="text-sm font-mono text-red-400 mt-1">
                          {item.problem}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-mono text-muted-foreground">
                          Solution:
                        </span>
                        <p className="text-sm font-mono text-white mt-1">
                          {item.solution}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
