/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        retro: ['"Press Start 2P"', "monospace"],
        terminal: ["Press Start 2P", "monospace"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        "cyber-black": "#0d0d0d",
        "cyber-green": "#39ff14",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-accent": "var(--gradient-accent)",
        "gradient-background": "var(--gradient-background)",
      },
      boxShadow: {
        "neon-green": "var(--shadow-neon-green)",
        "neon-blue": "var(--shadow-neon-blue)",
        "neon-purple": "var(--shadow-neon-purple)",
      },
      textShadow: {
        glow: "0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 30px #39ff14",
        "glow-sm": "0 0 5px #39ff14",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "matrix-rain": {
          "0%": { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 5px hsl(120 100% 50%), 0 0 10px hsl(120 100% 50%)",
          },
          "50%": {
            boxShadow: "0 0 10px hsl(120 100% 50%), 0 0 20px hsl(120 100% 50%)",
          },
        },
        "terminal-blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "icon-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(180deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "matrix-rain": "matrix-rain 3s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "terminal-blink": "terminal-blink 1s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out",
        "icon-rotate": "icon-rotate 0.3s ease-in-out",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-glow": {
          textShadow: "0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 30px #39ff14",
        },
        ".text-glow-sm": {
          textShadow: "0 0 5px #39ff14",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
