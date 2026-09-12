import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { CARBON_DATA } from './data';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="text-ink-faint mb-1">{label}</p>
      <p className="text-danger">Emissions: <span className="font-semibold text-ink">{payload[0]?.value} kg</span></p>
      <p className="text-success">Savings: <span className="font-semibold text-ink">{payload[1]?.value} kg</span></p>
    </div>
  );
}

export default function CarbonEmissionsChart() {
  return (
    <Card variant="default" padding="md" className="flex flex-col gap-4">
      <SectionHeading title="Carbon Emissions" subtitle="kg CO₂e per month" />
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={CARBON_DATA} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-danger" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--ink-muted)' }} />
            <Area type="monotone" dataKey="emissions" name="Emissions" stroke="var(--danger)" strokeWidth={2} fill="url(#grad-danger)" />
            <Bar dataKey="savings" name="Eco savings" fill="var(--success)" fillOpacity={0.4} radius={[4, 4, 0, 0]} barSize={18} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}