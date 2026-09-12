import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Check, Crown, Fuel, Leaf, Sparkles, Truck, Wallet, X } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SectionHeading from '@/components/ui/SectionHeading';
import { useFleetStore } from '@/state/fleetStore';
import { rankVehiclesForLoad } from '@/services/assignment';
import { formatINR } from '@/lib/utils';
import { VEHICLE_TYPE_LABELS } from '@/features/fleet/data';
import type { AssignmentScore } from '@/types';

const PRESETS = [
  { label: '2 t', value: 2000 },
  { label: '5 t', value: 5000 },
  { label: '8 t', value: 8000 },
  { label: '12 t', value: 12000 },
];

export default function AiAssignmentAdvisor() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const [weight, setWeight] = useState('5000');
  const [distance, setDistance] = useState('340');

  const weightKg = Number(weight) || 0;
  const distanceKm = Number(distance) || 0;

  const ranked = useMemo(
    () => rankVehiclesForLoad({ vehicles, weightKg, distanceKm }),
    [vehicles, weightKg, distanceKm],
  );

  const winner = ranked[0];
  const capacityPass = ranked.filter((r) => r.capacityOk).length;
  const availableCount = ranked.filter((r) => r.availability).length;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title="AI Fleet Advisor"
        subtitle="Adaptive vehicle assignment — the recommendation adapts to your customized fleet"
        action={
          <Badge variant="info" className="gap-1.5">
            <Sparkles className="size-3" />
            Phase 5
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Scenario */}
        <Card padding="sm" className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">Shipment scenario</p>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">Cargo weight</span>
            <div className="flex gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setWeight(String(p.value))}
                  className={`flex-1 rounded-[var(--r-sm)] border px-2 py-1.5 text-xs font-medium transition-colors ${
                    weightKg === p.value
                      ? 'border-accent/50 bg-accent-soft text-accent'
                      : 'border-[var(--border)] bg-surface text-ink-muted hover:text-ink'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={0}
              max={20000}
              step={100}
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="kg"
            />
          </div>

          <Input
            label="Route distance (km)"
            type="number"
            min={0}
            step={10}
            value={distance}
            onChange={(e) => setDistance(e.target.value.replace(/[^\d]/g, ''))}
          />

          <div className="flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-3 py-2.5 text-xs text-ink-muted">
            <Bot className="size-3.5 text-accent" />
            Scoring considers capacity, fuel economy, operating cost, fleet health and availability.
          </div>

          <p className="text-[11px] leading-relaxed text-ink-faint">
            {vehicles.length} vehicles analysed · {availableCount} available · {capacityPass} pass the
            {weightKg > 0 ? ` ${(weightKg / 1000).toFixed(weightKg % 1000 === 0 ? 0 : 1)} t` : ' '} capacity check.
          </p>
        </Card>

        {/* Recommendation */}
        <Card padding="sm" className="flex flex-col gap-3">
          {winner ? (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-md)] border border-accent/25 bg-accent-soft/10 p-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent">
                  <Crown className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {winner.vehicleName}
                    <span className="ml-2 text-xs font-normal text-ink-faint">{winner.plateNumber}</span>
                  </p>
                  <p className="text-xs text-ink-muted">
                    {VEHICLE_TYPE_LABELS[winner.vehicleType as keyof typeof VEHICLE_TYPE_LABELS] ?? winner.vehicleType} · adapted
                    to your fleet
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-accent">{Math.round(winner.score * 100)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-ink-faint">AI score</p>
                </div>
              </div>

              <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-surface p-3.5">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  Why this vehicle
                </p>
                <ul className="flex flex-col gap-1.5">
                  {winner.reasons.map((reason, i) => (
                    <li key={reason} className="flex items-start gap-2 text-xs text-ink-mid">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-soft font-mono text-[9px] text-success">
                        {i + 1}
                      </span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto grid grid-cols-3 gap-2">
                <MetaCell icon={Wallet} label="Est. cost" value={formatINR(winner.costEstimate)} />
                <MetaCell icon={Leaf} label="CO₂" value={`${winner.co2EstimateKg} kg`} />
                <MetaCell icon={Fuel} label="Est. time" value={`${Math.round(winner.etaMin)} min`} />
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center text-ink-faint">
              <Bot className="size-7" />
              <p className="text-sm text-ink-muted">Register vehicles to start receiving AI recommendations.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Ranked fleet */}
      {ranked.length > 0 && (
        <Card padding="sm" className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">Ranked fleet</p>
          <div className="flex flex-col gap-2">
            {ranked.map((r, index) => (
              <RankedRow key={r.vehicleId} rank={index + 1} row={r} best={index === 0} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-2.5 py-2">
      <span className="flex items-center gap-1 text-[10px] text-ink-faint">
        <Icon className="size-3" />
        {label}
      </span>
      <p className="mt-0.5 font-mono text-xs font-semibold text-ink">{value}</p>
    </div>
  );
}

function RankedRow({ rank, row, best }: { rank: number; row: AssignmentScore; best: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={`flex flex-wrap items-center gap-3 rounded-[var(--r-sm)] border px-3 py-2.5 transition-colors ${
        best ? 'border-accent/25 bg-accent-soft/10' : 'border-[var(--border)] bg-surface'
      }`}
    >
      <span className="w-5 font-mono text-[11px] text-ink-faint">{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">{row.vehicleName}</p>
          <Badge size="sm" variant={row.capacityOk ? 'success' : 'danger'}>
            {row.capacityOk ? <Check className="size-2.5" /> : <X className="size-2.5" />}
            {row.capacityOk ? 'Fits' : 'Over cap'}
          </Badge>
          {!row.availability && <Badge size="sm" variant="warning">Unavailable</Badge>}
        </div>
        <p className="font-mono text-[10px] text-ink-faint">
          {row.plateNumber} · ₹{row.costEstimate} · {row.co2EstimateKg} kg CO₂ · {Math.round(row.etaMin)} min
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sh">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(row.score * 100)}%` }}
            transition={{ delay: 0.2 + rank * 0.04, duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] }}
            className="h-full rounded-full"
            style={{ background: best ? 'var(--accent)' : 'var(--ink-faint)' }}
          />
        </div>
      </div>
    </motion.div>
  );
}