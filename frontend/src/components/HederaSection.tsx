import { Card, CardContent } from "../components/ui/card2";
import { Button } from "../components/ui/button2";
import { ExternalLink, CheckCircle } from "lucide-react";
import hederaImage from "../assets/hedera bg.jpg";

const HederaSection = () => {
  const benefits = [
    "Sub-second transaction finality",
    "Near-zero transaction fees",
    "Carbon-negative consensus",
    "Enterprise-grade security",
    "Regulatory compliance ready",
    "High-throughput performance",
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-terminal text-3xl md:text-4xl text-glow-blue mb-4">
            POWERED BY HEDERA
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            Built on the world's most advanced distributed ledger technology
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-slide-up">
            <div>
              <h3 className="text-2xl font-terminal text-glow-green mb-4">
                ENTERPRISE-GRADE INFRASTRUCTURE
              </h3>
              <p className="text-muted-foreground font-mono leading-relaxed">
                Yieldera leverages Hedera's hashgraph consensus algorithm to
                provide unparalleled speed, security, and sustainability.
                Experience the future of DeFi with instant finality and minimal
                environmental impact.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-mono text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="group">
                LEARN MORE ABOUT HEDERA
                <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div
            className="relative animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Card className="neon-border bg-card/30 backdrop-blur-sm overflow-hidden group hover:shadow-neon-blue transition-all duration-500">
              <CardContent className="p-0">
                <img
                  src={hederaImage}
                  alt="Hedera Integration"
                  className="w-full h-auto object-cover"
                />
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-terminal text-secondary mb-1">
                        10,000+
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        TPS
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-terminal text-accent mb-1">
                        $0.0001
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        TX COST
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-terminal text-primary mb-1">
                        3s
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        FINALITY
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-terminal text-secondary mb-1">
                        -VE
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        CARBON
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Elements */}
            {/* <div className="absolute -top-4 -right-4 w-8 h-8 border-2 border-primary rounded-full animate-glow-pulse"></div>
            <div
              className="absolute -bottom-4 -left-4 w-6 h-6 border-2 border-secondary rounded-full animate-glow-pulse"
              style={{ animationDelay: "1s" }}
            ></div> */}
          </div>
        </div>

        {/* Trust Indicators */}
        {/* <div className="mt-20 text-center">
          <h4 className="font-terminal text-lg text-muted-foreground mb-8">
            TRUSTED BY ENTERPRISES WORLDWIDE
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            <div className="font-mono text-sm">GOOGLE</div>
            <div className="font-mono text-sm">IBM</div>
            <div className="font-mono text-sm">BOEING</div>
            <div className="font-mono text-sm">LG</div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default HederaSection;
