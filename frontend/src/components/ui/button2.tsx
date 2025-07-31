import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 neon-border hover:shadow-neon-green",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground neon-border hover:shadow-neon-green",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-neon-blue",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline text-glow-green",
        neon: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-neon-green hover:shadow-neon-green font-terminal text-xs uppercase tracking-wider",
        terminal:
          "bg-muted border border-primary text-primary font-terminal text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground hover:shadow-neon-green transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-sm",
        sm: "h-9 px-3 rounded-sm",
        lg: "h-12 px-8 rounded-sm",
        icon: "h-10 w-10 rounded-sm",
        xl: "h-14 px-12 rounded-sm text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
