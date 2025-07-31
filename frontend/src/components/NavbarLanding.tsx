import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import logo from "../assets/yieldera-logo.jpg";
import { Button } from "./ui/button2";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "FEATURES", href: "#features" },
    { name: "HEDERA", href: "#hedera" },
    { name: "DOCS", href: "#docs" },
    { name: "COMMUNITY", href: "#community" },
  ];

  const navigate = useNavigate();
  const handleLaunchApp = () => {
    navigate("/app");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Yieldera"
              className="w-8 h-auto rounded-sm"
            />
            <span className="font-terminal text-lg text-glow-green">
              YIELDERA
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* <Button variant="ghost" size="sm" className="font-terminal text-xs">
              LOGIN
            </Button> */}
            <Button
              variant="neon"
              size="sm"
              className="group"
              onClick={handleLaunchApp}
            >
              <Zap className="w-4 h-4 mr-1" />
              Launch App
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 space-y-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-2">
                {/* <Button
                  variant="ghost"
                  size="sm"
                  className="w-full font-terminal text-xs"
                >
                  LOGIN
                </Button> */}
                <Button
                  variant="neon"
                  size="sm"
                  className="w-full"
                  onClick={handleLaunchApp}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Launch App
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
