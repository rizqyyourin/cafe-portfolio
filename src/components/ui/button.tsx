import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#1e1b18] px-5 py-3 text-[#fffaf3] hover:bg-[#3f3731]",
        accent: "bg-accent px-5 py-3 text-accent-foreground hover:bg-[#ac5129]",
        outline: "border border-[#1e1b18] px-5 py-3 text-[#1e1b18] hover:bg-[#1e1b18] hover:text-[#fffaf3]",
        ghost: "px-3 py-2 text-[#1e1b18] hover:bg-black/5",
      },
      size: { default: "min-h-11", sm: "min-h-9 text-xs", lg: "min-h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return <Component className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
