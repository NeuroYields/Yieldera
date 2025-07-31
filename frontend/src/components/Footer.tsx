import { Github, Twitter, MessageCircle, FileText, Zap } from "lucide-react";
import { Button } from "./ui/button2";

const Footer = () => {
  const links = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Roadmap", href: "#roadmap" },
      { name: "Beta Access", href: "#beta" },
      { name: "Pricing", href: "#pricing" },
    ],
    developers: [
      { name: "Documentation", href: "#docs" },
      { name: "API Reference", href: "#api" },
      { name: "SDK", href: "#sdk" },
      { name: "Github", href: "#github" },
    ],
    community: [
      { name: "Discord", href: "#discord" },
      { name: "Twitter", href: "#twitter" },
      { name: "Telegram", href: "#telegram" },
      { name: "Blog", href: "#blog" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Risk Disclosure", href: "#risks" },
      { name: "Audit Reports", href: "#audits" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/logo.png"
                alt="Yieldera"
                className="w-7 h-7 rounded-sm"
              />
              <span className="font-terminal text-lg text-glow-green">
                YIELDERA
              </span>
            </div>
            <p className="text-muted-foreground font-mono text-sm mb-6 max-w-sm">
              The 1st AI-powered Automated Liquidity Manager on the Hedera
              Blockchain. Optimizing DeFi yields through cutting-edge artificial
              intelligence.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-terminal text-sm text-primary mb-4">PRODUCT</h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground font-mono text-sm hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-terminal text-sm text-secondary mb-4">
              DEVELOPERS
            </h3>
            <ul className="space-y-2">
              {links.developers.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground font-mono text-sm hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-terminal text-sm text-accent mb-4">
              COMMUNITY
            </h3>
            <ul className="space-y-2">
              {links.community.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground font-mono text-sm hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-terminal text-sm text-muted-foreground mb-4">
              LEGAL
            </h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground font-mono text-sm hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground font-mono text-sm">
            © 2025 Yieldera. All rights reserved. Built on Hedera.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-muted-foreground font-mono text-xs">
              POWERED BY
            </span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-terminal text-xs text-glow-green">
                HEDERA
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
