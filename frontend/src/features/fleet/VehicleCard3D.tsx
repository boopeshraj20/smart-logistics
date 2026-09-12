import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, MousePointerClick } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import ProgressRing from '@/components/ui/ProgressRing';
import VehicleStage from '@/components/three/VehicleStage';
import { VEHICLE_TYPE_LABELS } from '@/features/fleet/data';
import { cn } from '@/lib/utils';
import { type Vehicle } from '@/types';

function statusVariant(status: Vehicle['status']): 'success' | 'info' | 'warning' | 'neutral' {
  switch (status) {
    case 'available':
      return 'success';
    case 'in-transit':
      return 'info';
    case 'maintenance':
      return 'warning';
    default:
      return 'neutral';
  }
}

function healthVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 65) return 'warning';
  return 'danger';
}

interface VehicleCard3DProps {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
}

export default function VehicleCard3D({ vehicle, selected, onSelect }: VehicleCard3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.25, ease: [0.175, 0.885, 0.32, 1.02] }}
      className={cn(
        'glass group relative flex flex-col overflow-hidden text-left transition-colors duration-300',
        'hover:border-[var(--border-h)]',
        selected && 'border-accent/60 bg-accent-soft/5 shadow-[var(--shadow-glow)]',
      )}
    >
      <div className="flex items-center justify-between px-4 pt-3.5">
        <span className="rounded-full bg-surface-h px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-mid ring-1 ring-[var(--border)]">
          {VEHICLE_TYPE_LABELS[vehicle.type]}
        </span>
        <Badge variant={statusVariant(vehicle.status)} size="sm">
          {vehicle.status.replace('-', ' ')}
        </Badge>
      </div>

      <div className="relative -mt-1 h-40">
        <VehicleStage type={vehicle.type} color={vehicle.color} rotateSpeed={hovered ? 2 : 0.7} interactive={false} className="h-full w-full" />
        <span className="pointer-events-none absolute right-3 top-2 flex items-center gap-1 text-[10px] text-ink-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <MousePointerClick className="size-3" />
          drag preview
        </span>
      </div>

      {selected && (
        <CircleDot className="absolute right-3 top-9 size-4 text-accent" />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)]/60 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{vehicle.name}</p>
          <p className="font-mono text-[11px] text-ink-faint">{vehicle.plateNumber}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-ink-faint">Health</span>
          <ProgressRing value={vehicle.healthScore} size={38} strokeWidth={4} label={`${vehicle.healthScore}`} variant={healthVariant(vehicle.healthScore)} />
        </div>
      </div>
    </motion.button>
  );
}