import LazyAnimatedSVG from "./LazyAnimatedSVG";
import { Card, CardContent } from "./ui/card2";

const ArchitectureSection = () => {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-terminal text-3xl md:text-4xl text-glow-green mb-4">
            HOW IT WORKS
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            Discover the intelligent architecture behind Yieldera's AI-powered
            liquidity management system
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Card className="neon-border bg-card/30 backdrop-blur-sm overflow-hidden hover:shadow-neon-green transition-all duration-500">
            <CardContent className="p-6 md:p-8">
              <LazyAnimatedSVG
                src="/Farouk's Architectures.svg"
                alt="Yieldera's AI-powered liquidity management architecture flowchart showing automated processes, risk assessment, yield optimization, and smart contract interactions"
                width={1200}
                height={800}
                className="rounded-lg"
                fallbackText="Loading Yieldera's architecture diagram..."
              />

              {/* Optional Caption */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground font-mono">
                  Interactive architecture diagram showing the complete flow of
                  AI-driven liquidity optimization on Hedera
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
