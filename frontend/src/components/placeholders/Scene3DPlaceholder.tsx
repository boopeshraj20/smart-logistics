import { motion } from 'framer-motion';
import { Box } from 'lucide-react';

export default function Scene3DPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] }}
      className="glass-accent flex h-[280px] flex-col items-center justify-center gap-3 overflow-hidden p-6"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 animate-chart-shimmer rounded-full border border-accent/20" />
        <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 animate-chart-shimmer rounded-full border border-accent/15" style={{ animationDelay: '0.6s' }} />
      </div>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <Box className="size-12 text-accent/70" strokeWidth={1.2} />
      </motion.div>
      <div className="relative text-center">
        <p className="text-sm font-medium text-ink-mid">3D Vehicle Visualization</p>
        <p className="mt-1 text-xs text-ink-faint">Interactive Three.js scene · Phase 3</p>
      </div>
    </motion.div>
  );
}