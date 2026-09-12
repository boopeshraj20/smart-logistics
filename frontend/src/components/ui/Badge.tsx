import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--r-full)] font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface-h text-ink-mid border border-[var(--border)]",
        success: "bg-success-soft text-success border border-success/20",
        warning: "bg-amber-soft text-amber border border-amber/20",
        danger: "bg-danger-soft text-danger border border-danger/20",
        info: "bg-accent-soft text-accent border border-accent/20",
        neutral: "bg-[rgba(255,255,255,0.04)] text-ink-faint border border-[var(--border)]",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

export default Badge;
