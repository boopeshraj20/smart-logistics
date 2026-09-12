import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import VehicleCard3D from '@/features/fleet/VehicleCard3D';
import { useFleetStore } from '@/state/fleetStore';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

interface FleetShowcaseProps {
  onAddVehicle: () => void;
}

export default function FleetShowcase({ onAddVehicle }: FleetShowcaseProps) {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedId = useFleetStore((s) => s.selectedId);
  const select = useFleetStore((s) => s.select);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title="Fleet Showcase"
        subtitle={`${vehicles.length} vehicles · interactive 3D previews`}
        action={
          <Button variant="primary" size="sm" onClick={onAddVehicle}>
            <Plus className="size-4" />
            Add Vehicle
          </Button>
        }
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => (
          <motion.div key={vehicle.id} variants={fadeUp}>
            <VehicleCard3D
              vehicle={vehicle}
              selected={vehicle.id === selectedId}
              onSelect={() => select(vehicle.id)}
            />
          </motion.div>
        ))}

        <motion.button
          variants={fadeUp}
          type="button"
          onClick={onAddVehicle}
          className="glass flex min-h-[240px] flex-col items-center justify-center gap-2 border-dashed text-ink-faint transition-colors hover:border-accent/40 hover:text-ink-muted"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-surface-h">
            <Plus className="size-5" />
          </span>
          <span className="text-sm">Register a new vehicle</span>
        </motion.button>
      </motion.div>
    </div>
  );
}