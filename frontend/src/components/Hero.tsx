import { Zap, Bot } from "lucide-react";
import heroImage from "../assets/ai-liquidity-hero.jpg";
import { Button } from "./ui/button2";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  const handleLaunchApp = () => {
    navigate("/app");
  };

  const partners = [
    {
      name: "Hedera",
      key: "hedera",
      logo: "/images/whbar.png",
      color: "primary",
    },
    {
      name: "SaucerSwap",
      key: "SaucerSwap",
      logo: "/images/tokens/sauce.webp",
      color: "primary",
    },
    {
      name: "Bonzo",
      key: "bonzo",
      logo: "/images/bonzo.png",
      color: "accent",
    },

    {
      name: "Etaswap",
      key: "etaswap",
      logo: "/images/etaswap.png",
      color: "secondary",
    },

    {
      name: "CoinGecko",
      key: "coingecko",
      logo: "/images/CoinGecko_logo.png",
      color: "green-400",
    },
  ];

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden py-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55 "
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/60 to-background" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        {/* Centered Hero Title */}
        <div className="text-center animate-slide-up mb-6">
          <div className="mb-4">
            <h1 className="font-terminal text-4xl md:text-6xl lg:text-7xl text-glow-green neon-pulse mb-4">
              YIELDERA
            </h1>
            <div className="flex items-center justify-center gap-2 text-secondary text-lg">
              <Bot className="w-6 h-6" />
              <span className="font-mono">
                AI-POWERED AUTOMATED LIQUIDITY MANAGER
              </span>
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Existing Content */}
          <div className="text-center lg:text-left animate-slide-up">
            {/* Headline */}
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight font-mono">
              <span className="text-glow-green">AGENTIC</span>{" "}
              <span className="text-glow-blue">LIQUIDITY</span>{" "}
              {/* <span className="text-glow-purple">DECENTRALIZED.</span> */}
            </h2>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto lg:mx-0 font-mono">
              <span className="underline">
                The 1st AI-powered Automated Liquidity Manager on the{" "}
                <span className="text-secondary font-semibold">Hedera</span>{" "}
                Blockchain.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              {/* <Button
                variant="terminal"
                size="xl"
                className="w-full sm:w-auto"
                onClick={handleLaunchApp}
              >
                Launch App
              </Button> */}
            </div>

            {/* Powered By Section */}
            <div className="mt-6 mb-4">
              <p className="text-sm text-muted-foreground font-mono mb-4 uppercase tracking-wider">
                Powered by
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-8">
                {partners.map((partner) => (
                  <div key={partner.key} className="group relative">
                    <div
                      className={`flex items-center justify-center w-24 h-20 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border-2 border-dashed border-${partner.color}/30 hover:border-${partner.color}/60 transition-all duration-300 hover:shadow-lg hover:shadow-${partner.color}/20 backdrop-blur-sm`}
                    >
                      <div className="text-center">
                        <div className="w-12 h-8 mx-auto flex items-center justify-center">
                          <img
                            src={partner.logo}
                            alt={`${partner.name} logo`}
                            className="max-w-full max-h-full object-contain filter brightness-90 group-hover:brightness-110 transition-all duration-300"
                          />
                        </div>
                        <span
                          className={`text-xs text-muted-foreground font-mono group-hover:text-${partner.color} transition-colors`}
                        >
                          {partner.name.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto lg:mx-0 font-mono">
              Optimize your DeFi yields 24/7 with cutting-edge artificial
              intelligence.
            </p>
          </div>

          {/* Right Side - How It Works Architecture Diagram */}
          <div className="animate-slide-up delay-200">
            <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl border border-primary/20 p-6 backdrop-blur-sm">
              <h3 className="text-2xl md:text-3xl font-terminal text-glow-green mb-6 text-center">
                HOW IT WORKS
              </h3>

              {/* Architecture SVG Diagram */}
              <div className="relative">
                <object
                  data="/Farouk's Architectures.svg"
                  type="image/svg+xml"
                  className="w-full h-auto max-h-[500px] rounded-lg"
                  aria-label="Yieldera's AI-powered liquidity management architecture flowchart showing automated processes, risk assessment, yield optimization, and smart contract interactions"
                >
                  <img
                    src="/Farouk's Architectures.svg"
                    alt="Yieldera's AI-powered liquidity management architecture"
                    className="w-full h-auto max-h-[500px] object-contain rounded-lg"
                  />
                </object>

                {/* Caption */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground font-mono">
                    Interactive architecture diagram showing AI-driven liquidity
                    optimization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Elements */}
      {/* <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-terminal-blink"></div>
        </div>
      </div> */}
    </section>
  );
};

export default Hero;
