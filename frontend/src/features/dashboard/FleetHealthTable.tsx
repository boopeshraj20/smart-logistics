import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ProgressRing from '@/components/ui/ProgressRing';
import SectionHeading from '@/components/ui/SectionHeading';
import { FLEET_HEALTH, type HealthRow } from './data';
import { predictMaintenance, type AiHealthReport } from '@/services/ai';
import { useFleetStore } from '@/state/fleetStore';

const TYPE_LABEL: Record<string, string> = {
  'heavy-truck': 'Heavy Truck',
  'mini-truck': 'Mini Truck',
  tempo: 'Tempo',
  'delivery-van': 'Delivery Van',
};

const STATUS_LABEL: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  critical: 'Critical',
};

function healthVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
}

function statusVariant(status: string) {
  if (status === 'Excellent') return 'success' as const;
  if (status === 'Good') return 'info' as const;
  if (status === 'Fair') return 'warning' as const;
  return 'danger' as const;
}

function reportToRow(r: AiHealthReport): HealthRow {
  return {
    id: r.vehicleId,
    name: r.plateNumber || r.vehicleName,
    type: TYPE_LABEL[r.vehicleType] ?? r.vehicleType,
    health: Math.round(r.healthScore),
    status: STATUS_LABEL[r.statusLabel] ?? r.statusLabel,
    nextService: `${Math.round(r.remainingKmToService).toLocaleString()} km`,
  };
}

const rowFade = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

export default function FleetHealthTable() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const [rows, setRows] = useState<HealthRow[]>(() => FLEET_HEALTH.slice(0, 6));
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    void predictMaintenance(vehicles).then((reports) => {
      if (!active) return;
      if (reports && reports.length > 0) {
        const sorted = [...reports].sort((a, b) => a.healthScore - b.healthScore);
        setRows(sorted.map(reportToRow));
        setLive(true);
      }
    });
    return () => {
      active = false;
    };
  }, [vehicles]);

  return (
    <Card variant="default" padding="md" className="flex h-full flex-col gap-4">
      <SectionHeading
        title="Fleet Health Overview"
        subtitle="Predictive maintenance scores"
        action={
          <div className="flex items-center gap-2">
            {live && (
              <Badge variant="success" size="sm">
                ML
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              View All ↗
            </Button>
          </div>
        }
      />
      <div className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              <th className="pb-2.5 pr-3 font-medium">Vehicle</th>
              <th className="pb-2.5 pr-3 font-medium">Type</th>
              <th className="pb-2.5 pr-3 font-medium">Health</th>
              <th className="pb-2.5 pr-3 font-medium">Status</th>
              <th className="pb-2.5 font-medium">Next Service</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((row, i) => (
              <motion.tr
                key={row.id}
                variants={rowFade}
                initial="hidden"
                animate="show"
                custom={i}
                className="border-b border-[var(--border)]/50 transition-colors last:border-0 hover:bg-surface-h"
              >
                <td className="py-3 pr-3">
                  <p className="text-sm font-medium text-ink">{row.name}</p>
                </td>
                <td className="py-3 pr-3 text-sm text-ink-muted">{row.type}</td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <ProgressRing value={row.health} size={36} strokeWidth={4} label={`${row.health}`} variant={healthVariant(row.health)} />
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <Badge variant={statusVariant(row.status)} size="sm">{row.status}</Badge>
                </td>
                <td className="py-3 font-mono text-xs text-ink-mid">{row.nextService}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}