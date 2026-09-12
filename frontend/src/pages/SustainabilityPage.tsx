import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Truck, MapPin } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressRing from '@/components/ui/ProgressRing';
import SectionHeading from '@/components/ui/SectionHeading';
import CarbonEmissionsChart from '@/features/dashboard/CarbonEmissionsChart';
import FuelEfficiencyChart from '@/features/dashboard/FuelEfficiencyChart';
import { assessEco, type AiEcoResult } from '@/services/ai';
import { useFleetStore } from '@/state/fleetStore';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

const TYPE_LABEL: Record<string, string> = {
  'heavy-truck': 'Heavy Truck',
  'mini-truck': 'Mini Truck',
  tempo: 'Tempo',
  'delivery-van': 'Delivery Van',
};

function scoreVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 75) return 'success';
  if (score >= 55) return 'warning';
  return 'danger';
}

export default function SustainabilityPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const [distanceKm, setDistanceKm] = useState(340);
  const [weightKg, setWeightKg] = useState(4000);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [result, setResult] = useState<AiEcoResult | null>(null);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    setBusy(true);
    setOffline(false);
    const res = await assessEco({ distanceKm, weightKg, vehicles });
    setBusy(false);
    if (res) {
      setResult(res);
      setOffline(false);
    } else {
      setResult(null);
      setOffline(true);
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Sustainability</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Green logistics — rank every candidate on fuel, CO₂ and operating cost for a single trip.
          </p>
        </div>
        {result && (
          <Badge variant="success" size="md">
            <Leaf className="size-3" /> ML assessed
          </Badge>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card variant="default" padding="md" className="flex flex-col gap-4 lg:col-span-1">
          <SectionHeading
            title="Assess a dispatch"
            subtitle="Trip-level environmental impact"
            action={
              <div className="flex size-9 items-center justify-center rounded-[var(--r-sm)] bg-success-soft text-success">
                <Leaf className="size-4" />
              </div>
            }
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Route distance (km)</span>
            <div className="flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-3 py-2">
              <MapPin className="size-4 text-ink-faint" />
              <input
                type="number"
                min={1}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full bg-transparent font-mono text-sm text-ink outline-none"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Cargo weight (kg)</span>
            <div className="flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-3 py-2">
              <Truck className="size-4 text-ink-faint" />
              <input
                type="number"
                min={0}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-transparent font-mono text-sm text-ink outline-none"
              />
            </div>
          </label>
          <p className="text-[11px] text-ink-faint">
            {vehicles.length} candidate vehicles from your fleet. Mirrors CO₂-per-litre of {2.68} kg and the heavy-truck baseline.
          </p>
          <Button variant="primary" size="md" onClick={run} loading={busy} disabled={distanceKm <= 0}>
            <Leaf className="size-4" /> Run assessment
          </Button>
        </Card>

        <div className="flex flex-col gap-5 lg:col-span-2">
          {offline && (
            <Card variant="default" padding="md" className="border-dashed">
              <p className="text-sm text-ink-muted">
                ML service unreachable — showing fleet baselines. Start the backend to see the AI ranking.
              </p>
            </Card>
          )}

          {result && (
            <>
              <Card variant="default" padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <ProgressRing
                    value={result.sustainabilityScore}
                    size={110}
                    strokeWidth={8}
                    label={`${Math.round(result.sustainabilityScore)}`}
                    variant={scoreVariant(result.sustainabilityScore)}
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-ink-muted">Sustainability score</p>
                    <p className="text-lg font-semibold text-ink">{result.recommendation}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-[var(--r-sm)] bg-success-soft px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">CO₂ saved</p>
                    <p className="font-mono text-lg font-semibold text-success">−{Math.round(result.ecoSavingsKg)} kg</p>
                  </div>
                  <div className="rounded-[var(--r-sm)] bg-cyan-soft px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Trip fuel</p>
                    <p className="font-mono text-lg font-semibold text-cyan">{Math.round(result.fleetFuelL)} L</p>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="md" className="flex flex-col gap-4">
                <SectionHeading title="Vehicle ranking" subtitle="Fuel, emissions and cost per candidate" />
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        <th className="pb-2.5 pr-3 font-medium">Vehicle</th>
                        <th className="pb-2.5 pr-3 font-medium">Type</th>
                        <th className="pb-2.5 pr-3 font-medium">Fuel</th>
                        <th className="pb-2.5 pr-3 font-medium">CO₂</th>
                        <th className="pb-2.5 pr-3 font-medium">Cost</th>
                        <th className="pb-2.5 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ranking.map((r, i) => (
                        <tr key={r.vehicleId} className="border-b border-[var(--border)]/50 last:border-0 hover:bg-surface-h">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="flex size-5 items-center justify-center rounded-full bg-surface-h text-[10px] font-semibold text-ink-mid">
                                {i + 1}
                              </span>
                              <p className="text-sm font-medium text-ink">{r.vehicleName}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-sm text-ink-muted">{TYPE_LABEL[r.vehicleType] ?? r.vehicleType}</td>
                          <td className="py-3 pr-3 font-mono text-sm text-ink-mid">{Math.round(r.fuelL)} L</td>
                          <td className="py-3 pr-3 font-mono text-sm text-ink-mid">{Math.round(r.co2Kg)} kg</td>
                          <td className="py-3 pr-3 font-mono text-sm text-ink-mid">₹{Math.round(r.cost).toLocaleString()}</td>
                          <td className="py-3 pr-3 font-mono text-sm font-semibold text-ink">{Math.round(r.sustainabilityScore)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-2 rounded-[var(--r-md)] bg-surface-h px-4 py-3">
                  <p className="text-xs text-ink-muted">{result.explanation.summary}</p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-ink-faint">
                    {result.explanation.bullets.slice(0, 4).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            </>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FuelEfficiencyChart />
            <CarbonEmissionsChart />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}