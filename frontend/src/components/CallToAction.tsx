import { ArrowRight, Rocket, Users, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button2";
import { Input } from "./ui/input2";

const CallToAction = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email submission logic
    console.log("Email submitted:", email);
    setEmail("");
  };

  const handleLaunchApp = () => {
    navigate("/app");
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main CTA */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 border-2 border-primary rounded-full bg-primary/10 animate-glow-pulse">
              <Rocket className="w-12 h-12 text-primary" />
            </div>
          </div>

          <h2 className="font-terminal text-3xl md:text-5xl text-glow-green mb-6">
            JOIN THE FUTURE OF DEFI
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono mb-8">
            Be among the first to experience AI-powered liquidity management on
            Hedera. Early adopters get exclusive benefits and priority access.
          </p>

          {/* Email Signup */}
          {/* <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neon-border bg-muted/50 backdrop-blur-sm font-mono"
                required
              />
              <Button type="submit" variant="neon" size="default">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form> */}

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {/* <Button variant="neon" size="xl" className="group w-full sm:w-auto">
              <Users className="mr-2 w-5 h-5" />
              JOIN BETA WAITLIST
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button> */}

            <Button
              variant="terminal"
              size="xl"
              className="w-full sm:w-auto group"
              onClick={handleLaunchApp}
            >
              <Zap className="mr-2 w-5 h-5" />
              Launch App
            </Button>
          </div>

          {/* Beta Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 neon-border bg-card/30 backdrop-blur-sm rounded-sm">
              <div className="text-2xl font-terminal text-primary mb-2">0%</div>
              <div className="text-sm text-muted-foreground font-mono">
                BETA FEES
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Free access during beta period
              </div>
            </div>

            <div className="text-center p-6 neon-border bg-card/30 backdrop-blur-sm rounded-sm">
              <div className="text-2xl font-terminal text-secondary mb-2">
                24/7
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                SUPPORT
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Direct access to our team
              </div>
            </div>

            <div className="text-center p-6 neon-border bg-card/30 backdrop-blur-sm rounded-sm">
              <div className="text-2xl font-terminal text-accent mb-2">∞</div>
              <div className="text-sm text-muted-foreground font-mono">
                REWARDS
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Exclusive token airdrops
              </div>
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        {/* <div className="text-center border-t border-border pt-12">
          <p className="text-sm text-muted-foreground font-mono mb-4">
            Questions? Want to learn more?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="ghost" className="text-glow-blue">
              READ DOCUMENTATION
            </Button>
            <Button variant="ghost" className="text-glow-purple">
              JOIN DISCORD
            </Button>
            <Button variant="ghost" className="text-glow-green">
              FOLLOW TWITTER
            </Button>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default CallToAction;
