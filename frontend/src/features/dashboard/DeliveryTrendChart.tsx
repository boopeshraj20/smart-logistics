import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { DELIVERY_TREND } from './data';
import { forecastDemand, type AiTrendPoint } from '@/services/ai';

interface ChartPoint {
  date: string;
  deliveries: number | null;
  onTime: number | null;
  predicted?: number | null;
  lower?: number | null;
  upper?: number | null;
}

function fmtShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey?: string; value?: number | null }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="text-ink-faint mb-1">{label}</p>
      {payload.map((p) => {
        const val = p.value ?? 0;
        return (
          <p key={p.dataKey} className="text-ink-mid">
            {p.dataKey === 'deliveries' && 'Deliveries'}
            {p.dataKey === 'onTime' && 'On-time'}
            {p.dataKey === 'predicted' && 'Forecast'}
            {p.dataKey === 'upper' && 'Upper band'}
            {p.dataKey === 'lower' && 'Lower band'}
            : <span className="font-semibold text-ink">{Number(val).toFixed(0)}</span>
          </p>
        );
      })}
    </div>
  );
}

export default function DeliveryTrendChart() {
  const [data, setData] = useState<ChartPoint[]>(() => DELIVERY_TREND);
  const [forecastActive, setForecastActive] = useState(false);

  useEffect(() => {
    let active = true;
    void forecastDemand(14).then((res) => {
      if (!active || !res) return;
      const series = res.points.map((p: AiTrendPoint) => ({
        date: fmtShort(p.date),
        deliveries: p.actual ?? null,
        onTime: p.actual ?? null,
        predicted: p.predicted,
        lower: p.lower,
        upper: p.upper,
      }));
      setData(series);
      setForecastActive(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card variant="default" padding="md" className="flex flex-col gap-4">
      <SectionHeading
        title={forecastActive ? 'Demand Forecast' : 'Delivery Performance'}
        subtitle={forecastActive ? 'ML projection with 95% confidence band · 14 days' : '14-day rolling window'}
      />
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-accent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {forecastActive && (
              <>
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#grad-cyan)" dot={false} activeDot={false} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--abyss)" dot={false} activeDot={false} />
                <Area type="monotone" dataKey="predicted" stroke="var(--cyan)" strokeWidth={2} fill="transparent" dot={false} />
              </>
            )}
            <Area type="monotone" dataKey="deliveries" stroke="var(--accent)" strokeWidth={2} fill="url(#grad-accent)" dot={false} />
            {!forecastActive && <Area type="monotone" dataKey="onTime" stroke="var(--cyan)" strokeWidth={2} fill="url(#grad-cyan)" dot={false} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}