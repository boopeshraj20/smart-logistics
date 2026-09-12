import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { FUEL_DATA } from './data';

const typeColors: Record<string, string> = {
  'Heavy Truck': 'var(--accent)',
  'Mini Truck': 'var(--cyan)',
  'Tempo': 'var(--violet)',
  'Delivery Van': 'var(--amber)',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { vehicle: string; efficiency: number; type: string } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="text-ink-faint">{d.vehicle}</p>
      <p className="font-semibold text-ink">{d.efficiency} km/L — {d.type}</p>
    </div>
  );
}

export default function FuelEfficiencyChart() {
  return (
    <Card variant="default" padding="md" className="flex flex-col gap-4">
      <SectionHeading title="Fuel Efficiency" subtitle="km per litre by vehicle" />
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={FUEL_DATA} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="vehicle" tick={{ fill: 'var(--ink-faint)', fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="efficiency" radius={[0, 6, 6, 0]} barSize={18}>
              {FUEL_DATA.map((entry) => (
                <Cell key={entry.vehicle} fill={typeColors[entry.type] ?? 'var(--accent)'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}