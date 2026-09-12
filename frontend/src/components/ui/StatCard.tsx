import { type HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import Card from "./Card";
import Badge from "./Badge";

const accentMap = {
  accent: { bg: "bg-accent-soft", text: "text-accent", stroke: "var(--accent)" },
  cyan: { bg: "bg-cyan-soft", text: "text-cyan", stroke: "var(--cyan)" },
  violet: { bg: "bg-violet-soft", text: "text-violet", stroke: "var(--violet)" },
  amber: { bg: "bg-amber-soft", text: "text-amber", stroke: "var(--amber)" },
  success: { bg: "bg-success-soft", text: "text-success", stroke: "var(--success)" },
} as const;

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: { value: number; trend: "up" | "down" | "neutral" };
  icon?: LucideIcon;
  accentColor?: keyof typeof accentMap;
  sparklineData?: number[];
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accentColor = "accent",
  sparklineData,
  className,
  ...props
}: StatCardProps) {
  const accent = accentMap[accentColor];
  const sparkData = sparklineData?.map((v, i) => ({ v, i }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.175, 0.885, 0.32, 1.02] }}
    >
      <Card variant="default" padding="md" className={cn("flex flex-col gap-3", className)} {...props}>
        <div className="flex items-start justify-between">
          {Icon && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-[var(--r-md)]", accent.bg)}>
              <Icon className={cn("h-5 w-5", accent.text)} />
            </div>
          )}
          {delta && (
            <Badge
              variant={
                delta.trend === "up"
                  ? "success"
                  : delta.trend === "down"
                  ? "danger"
                  : "neutral"
              }
              size="sm"
            >
              {delta.trend === "up" ? "+" : delta.trend === "down" ? "" : ""}
              {delta.value}%
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold tracking-tight text-ink">{value}</span>
          <span className="text-sm text-ink-muted">{label}</span>
        </div>

        {sparkData && sparkData.length > 1 && (
          <div className="mt-auto h-10 w-full opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`grad-${accentColor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent.stroke} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accent.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent.stroke}
                  strokeWidth={1.5}
                  fill={`url(#grad-${accentColor})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default StatCard;
