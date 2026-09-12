import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, CalendarClock, Scale } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import SectionHeading from '@/components/ui/SectionHeading';
import { forecastDemand, fallbackForecast, type AiForecastResult } from '@/services/ai';

function fmtDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function ChartData({ points }: { points: AiForecastResult['points'] }) {
  const series = points.map((p) => ({
    date: fmtDay(p.date),
    deliveries: p.actual ?? null,
    onTime: p.actual ?? null,
    predicted: p.predicted,
    lower: p.lower,
    upper: p.upper,
  }));
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-cyan-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-accent-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-[var(--shadow-md)]">
                  <p className="text-ink-faint mb-1">{label}</p>
                  {payload.map((p) => (
                    <p key={String(p.dataKey)} className="text-ink-mid">
                      {p.dataKey === 'deliveries' && 'Actual'}
                      {p.dataKey === 'predicted' && 'Forecast'}
                      {p.dataKey === 'upper' && 'Upper bound'}
                      {p.dataKey === 'lower' && 'Lower bound'}
                      : <span className="font-semibold text-ink">{Number(p.value ?? 0).toFixed(0)}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="upper" stroke="none" fill="url(#grad-cyan-band)" dot={false} activeDot={false} />
          <Area type="monotone" dataKey="lower" stroke="none" fill="var(--abyss)" dot={false} activeDot={false} />
          <Area type="monotone" dataKey="predicted" stroke="var(--cyan)" strokeWidth={2} fill="transparent" dot={false} />
          <Area type="monotone" dataKey="deliveries" stroke="var(--accent)" strokeWidth={2} fill="url(#grad-accent-actual)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DirectionChip({ direction }: { direction: 'positive' | 'negative' | 'neutral' }) {
  const variant = direction === 'positive' ? 'success' : direction === 'negative' ? 'warning' : 'default';
  return <Badge variant={variant} size="sm">{direction}</Badge>;
}

export default function DemandForecastPanel() {
  const [forecast, setForecast] = useState<AiForecastResult | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    let active = true;
    void forecastDemand(14).then((res) => {
      if (!active) return;
      setForecast(res ?? fallbackForecast(14));
      setIsLocal(!res);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!forecast) {
    return (
      <Card variant="default" padding="lg" className="flex items-center justify-center" >
        <p className="text-sm text-ink-muted">Loading forecast…</p>
      </Card>
    );
  }

  const peakValue = Math.max(...forecast.points.map((p) => p.predicted), 0);
  const peakGap = forecast.peakDays[0] ? fmtDay(forecast.peakDays[0]) : '—';
  const conf = Math.round(forecast.explanation.confidence * 100);
  const topFactors = forecast.explanation.factors.slice(0, 5);

  return (
    <Card variant="default" padding="md" className="flex flex-col gap-5">
      <SectionHeading
        title="Demand Forecast"
        subtitle={`Next ${forecast.horizonDays} days · Gradient Boosting on engineered time features`}
        action={
          <div className="flex items-center gap-2">
            {isLocal ? (
              <Badge variant="warning" size="sm">Local estimate</Badge>
            ) : (
              <Badge variant="success" size="sm"><Brain className="size-2.5" /> ML</Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Recommended Fleet Size"
          value={String(forecast.recommendedFleetSize)}
          icon={Scale}
          accentColor="accent"
          sparklineData={forecast.points.slice(-7).map((p) => p.predicted)}
        />
        <StatCard
          label="Busiest Day"
          value={peakGap}
          icon={CalendarClock}
          accentColor="cyan"
          sparklineData={forecast.points.slice(-7).map((p) => p.predicted)}
        />
        <StatCard
          label="Peak Load"
          value={`${Math.round(peakValue)}`}
          icon={Brain}
          accentColor="violet"
          sparklineData={forecast.points.slice(-7).map((p) => p.predicted)}
        />
      </div>

      <ChartData points={forecast.points} />

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Why the model says so</p>
          <p className="text-sm text-ink">{forecast.explanation.summary}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink-muted">
            {forecast.explanation.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <div className="w-full shrink-0 lg:w-72">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Confidence</p>
            <span className="font-mono text-xs text-cyan">{conf}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-h">
            <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${conf}%` }} />
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            {topFactors.map((f) => (
              <div key={f.feature} className="flex items-center justify-between gap-2 rounded-[var(--r-sm)] bg-surface-h px-2.5 py-1.5">
                <span className="text-xs text-ink-mid">{f.note}</span>
                <DirectionChip direction={f.direction} />
              </div>
            ))}
          </div>
          {forecast.model.model_id !== 'demand-local' && (
            <p className="mt-3 text-[11px] text-ink-faint">
              {forecast.model.family} · R² {forecast.model.metrics?.r2?.toFixed(2) ?? 'n/a'} · MAE{' '}
              {forecast.model.metrics?.mae?.toFixed(1) ?? 'n/a'}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}