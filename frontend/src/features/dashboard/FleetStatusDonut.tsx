import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { FLEET_STATUS } from './data';

const total = FLEET_STATUS.reduce((sum, d) => sum + d.value, 0);

function LegendItem({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0];
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      <p className="text-ink-faint">{d.name}</p>
      <p className="font-semibold text-ink">{d.value} vehicles</p>
    </div>
  );
}

export default function FleetStatusDonut() {
  return (
    <Card variant="default" padding="md" className="flex flex-col gap-4">
      <SectionHeading title="Fleet Status" subtitle="Current distribution" />
      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={FLEET_STATUS}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {FLEET_STATUS.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<LegendItem />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="text-2xl font-bold text-ink">{total}</span>
          <p className="text-[10px] text-ink-faint">vehicles</p>
        </div>
      </div>
    </Card>
  );
}