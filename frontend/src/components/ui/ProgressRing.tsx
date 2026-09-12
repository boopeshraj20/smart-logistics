import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const variantColors = {
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--amber)",
  danger: "var(--danger)",
  cyan: "var(--cyan)",
} as const;

const variantTrack = {
  accent: "rgba(79,140,255,0.12)",
  success: "rgba(52,211,153,0.12)",
  warning: "rgba(246,185,59,0.12)",
  danger: "rgba(255,92,108,0.12)",
  cyan: "rgba(45,212,191,0.12)",
} as const;

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  variant?: keyof typeof variantColors;
  className?: string;
}

function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  variant = "accent",
  className,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantTrack[variant]}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.175,0.885,0.32,1.02)" }}
        />
      </svg>
      {label && (
        <span
          className="absolute text-sm font-semibold text-ink"
          style={{ fontSize: size * 0.24 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default ProgressRing;
