import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(34,223,220,0.3)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_0_15px_rgba(148,163,184,0.3)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-primary text-primary-foreground hover:shadow-[0_0_30px_rgba(34,223,220,0.4)] transform hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(34,223,220,0.3)]",
        gradient: "bg-gradient-secondary text-primary-foreground hover:shadow-[0_0_25px_rgba(34,223,220,0.3)] transform hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(34,223,220,0.2)]",
        elegant: "bg-gradient-card text-foreground border border-primary/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(34,223,220,0.15)] transition-all duration-300 shadow-[0_0_10px_rgba(34,223,220,0.1)]",
        glow: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(34,223,220,0.4)] hover:shadow-[0_0_30px_rgba(34,223,220,0.5)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-full px-3",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
