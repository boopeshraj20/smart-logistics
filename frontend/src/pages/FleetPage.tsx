import { useState } from 'react';
import { motion } from 'framer-motion';

import VehicleEditorModal from '@/features/fleet/VehicleEditorModal';
import FleetShowcase from '@/features/fleet/FleetShowcase';
import VehicleDetailPanel from '@/features/fleet/VehicleDetailPanel';
import FleetAnalytics from '@/features/fleet/FleetAnalytics';
import AiAssignmentAdvisor from '@/features/fleet/AiAssignmentAdvisor';
import { useFleetStore } from '@/state/fleetStore';
import { type Vehicle } from '@/types';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

export default function FleetPage() {
  const selected = useFleetStore((s) => s.vehicles.find((v) => v.id === s.selectedId));
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Fleet Management</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Adaptive fleet personalization · 3D vehicle configurator · AI assignment
          </p>
        </div>
      </div>

      <FleetAnalytics />

      <AiAssignmentAdvisor />

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="min-w-0 flex-1">
          <FleetShowcase onAddVehicle={() => setAddOpen(true)} />
        </div>
        <div className="w-full shrink-0 xl:w-[340px]">
          {selected ? (
            <VehicleDetailPanel vehicle={selected} onEdit={() => setEditTarget(selected)} />
          ) : (
            <div className="glass flex min-h-[200px] items-center justify-center p-6 text-sm text-ink-faint">
              Select a vehicle to inspect details
            </div>
          )}
        </div>
      </div>

      <VehicleEditorModal key="new" open={addOpen} onClose={() => setAddOpen(false)} vehicle={null} />
      <VehicleEditorModal
        key={editTarget?.id ?? 'none'}
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        vehicle={editTarget}
      />
    </motion.div>
  );
}