import { motion } from 'framer-motion';
import { Check, ChevronDown, Fuel, Leaf, MapPin, Navigation, Truck, Wallet } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCompact, formatINR } from '@/lib/utils';
import type { AssignPlanResult, RouteResult } from '@/types';

interface RouteResultPanelProps {
  result: RouteResult | null;
  assign: AssignPlanResult | null;
  onSave: () => void;
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function RouteResultPanel({ result, assign, onSave }: RouteResultPanelProps) {
  if (!result) {
    return (
      <div className="glass flex min-h-[180px] flex-col items-center justify-center gap-2 p-6 text-center">
        <Navigation className="size-6 text-ink-faint" />
        <p className="text-sm text-ink-muted">Configure a route to see optimized results.</p>
        <p className="text-xs text-ink-faint">Distance · cost · CO₂ · recommended fleet</p>
      </div>
    );
  }

  const recommended = assign?.recommended;
  const stat = [
    { label: 'Distance', value: `${formatCompact(result.distanceKm)} km`, icon: Navigation },
    { label: 'Est. Time', value: fmtDuration(result.durationMin), icon: MapPin },
    { label: 'Fuel', value: `${Math.round(result.fuelEstimateL)} L`, icon: Fuel },
    { label: 'Cost', value: formatINR(result.costEstimate), icon: Wallet },
    { label: 'CO₂', value: `${formatCompact(result.co2EstimateKg * 1000)} g`, icon: Leaf },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col gap-4 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Optimized Route</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            {result.profile} · {result.steps?.length ? `${result.steps.length} legs` : 'real road network'}
          </p>
        </div>
        {recommended && <Badge variant="success">AI-assisted</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {stat.map((s) => (
          <div key={s.label} className="rounded-[var(--r-sm)] border border-[var(--border)] bg-surface p-3">
            <div className="flex items-center gap-1.5 text-ink-faint">
              <s.icon className="size-3" />
              <span className="text-[10px] uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="mt-1.5 font-mono text-sm font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {recommended && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-3.5 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-accent-soft text-accent">
              <Truck className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{recommended.vehicleName}</p>
              <p className="text-xs text-ink-faint">
                {recommended.plateNumber} · {recommended.vehicleType} · score {Math.round(recommended.score * 100)}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-ink-faint">Est. cost</p>
              <p className="font-mono text-sm font-semibold text-ink">{formatINR(recommended.costEstimate)}</p>
            </div>
          </div>

          {recommended.reasons.length > 0 && (
            <div className="rounded-[var(--r-sm)] border border-success/20 bg-success-soft/30 px-3.5 py-2.5">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-success">
                Why {recommended.vehicleName.split(' ')[0]} was selected
              </p>
              <ul className="flex flex-col gap-1">
                {recommended.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-xs text-ink-mid">
                    <Check className="mt-0.5 size-3 shrink-0 text-success" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-3.5 py-2">
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <ChevronDown className="size-3.5" />
          Route breakdown
        </span>
        <span className="font-mono text-xs text-ink-faint">
          {result.congestionPct !== undefined ? `${result.congestionPct.toFixed(0)}% congestion` : 'Corn maze avoided'}
        </span>
      </div>

      <Button onClick={onSave} className="mt-auto" disabled={!recommended}>
        <Check className="size-4" />
        Save as Shipment
      </Button>
    </motion.div>
  );
}