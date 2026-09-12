import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import DemandForecastPanel from '@/features/ai/DemandForecastPanel';
import ModelRegistryPanel from '@/features/ai/ModelRegistryPanel';
import FleetHealthTable from '@/features/dashboard/FleetHealthTable';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

export default function AiInsightsPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
            <Sparkles className="size-6 text-accent" /> AI Intelligence
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Demand forecasting, predictive maintenance and explainable recommendations from the trained ML layer.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <DemandForecastPanel />
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FleetHealthTable />
        <ModelRegistryPanel />
      </motion.div>
    </motion.div>
  );
}