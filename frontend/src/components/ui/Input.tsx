import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wide text-ink-faint"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "glass w-full rounded-[var(--r-sm)] border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
              "transition-all duration-[var(--dur-norm)]",
              "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25",
              Icon && "pl-9",
              error && "border-danger focus:border-danger focus:ring-danger/25",
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
