import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, HeartPulse, Package, Truck } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import DeliveryTrendChart from '@/features/dashboard/DeliveryTrendChart';
import FleetStatusDonut from '@/features/dashboard/FleetStatusDonut';
import FuelEfficiencyChart from '@/features/dashboard/FuelEfficiencyChart';
import CarbonEmissionsChart from '@/features/dashboard/CarbonEmissionsChart';
import AiRecommendations from '@/features/dashboard/AiRecommendations';
import FleetHealthTable from '@/features/dashboard/FleetHealthTable';
import DashboardMap from '@/features/map/DashboardMap';
import Scene3DPlaceholder from '@/components/placeholders/Scene3DPlaceholder';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const time = useClock();

  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useShipmentsStore((s) => s.shipments);

  const available = vehicles.filter((v) => v.available && v.status === 'available').length;
  const activeShipments = shipments.filter(
    (s) => s.status !== 'delivered' && s.status !== 'cancelled',
  ).length;
  const fleetHealth = vehicles.length
    ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length)
    : 0;

  const totals = shipments.reduce(
    (acc, s) => ({
      km: acc.km + (s.route?.distanceKm ?? 0),
      cost: acc.cost + (s.costEstimate ?? 0),
      co2: acc.co2 + (s.route?.co2EstimateKg ?? 0),
    }),
    { km: 0, cost: 0, co2: 0 },
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Fleet Command Center</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {shipments.length} shipments · {Math.round(totals.km).toLocaleString()} km · ₹
            {Math.round(totals.cost).toLocaleString()} · {Math.round(totals.co2).toLocaleString()} kg CO₂
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="success" size="md" className="gap-1.5">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-success" />
            Live
          </Badge>
          <p className="font-mono text-xs text-ink-faint">{time} IST</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Fleet"
          value={vehicles.length}
          icon={Truck}
          accentColor="accent"
          sparklineData={[18, 19, 20, 21, 22, 23, vehicles.length]}
        />
        <StatCard
          label="Available Vehicles"
          value={available}
          icon={CheckCircle2}
          accentColor="success"
          sparklineData={[12, 13, 13, 15, 14, 16, available]}
        />
        <StatCard
          label="Active Shipments"
          value={activeShipments}
          icon={Package}
          accentColor="cyan"
          sparklineData={[6, 8, 7, activeShipments, 10, 9, activeShipments]}
        />
        <StatCard
          label="Fleet Health Score"
          value={`${fleetHealth}%`}
          icon={HeartPulse}
          accentColor="violet"
          sparklineData={[80, 82, 81, 84, 85, 86, fleetHealth]}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DeliveryTrendChart />
        <FleetStatusDonut />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FuelEfficiencyChart />
        <CarbonEmissionsChart />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FleetHealthTable />
        <AiRecommendations />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashboardMap />
        <Scene3DPlaceholder />
      </motion.div>
    </motion.div>
  );
}