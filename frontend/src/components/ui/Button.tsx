import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--r-sm)] font-medium transition-all duration-[var(--dur-norm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-h shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-glow)]",
        secondary:
          "glass text-ink hover:text-ink-mid border border-[var(--border)] hover:border-[var(--border-h)]",
        ghost: "bg-transparent text-ink-mid hover:text-ink hover:bg-surface-h",
        danger:
          "bg-danger text-white hover:brightness-110 shadow-[var(--shadow-sm)]",
        outline:
          "bg-transparent text-ink-mid border border-[var(--border)] hover:border-[var(--border-h)] hover:text-ink",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0 justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "size" | "children">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        whileTap={disabled || loading ? undefined : { scale: 0.97 }}
        whileHover={disabled || loading ? undefined : { filter: "brightness(1.12)" }}
        transition={{ duration: 0.15 }}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
