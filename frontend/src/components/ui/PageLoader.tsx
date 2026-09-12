import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="flex size-12 items-center justify-center rounded-[var(--r-lg)] bg-accent-soft text-accent"
      >
        <Truck className="size-6" />
      </motion.div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
            className="size-1.5 rounded-full bg-accent"
          />
        ))}
      </div>
      <p className="text-xs uppercase tracking-widest text-ink-faint">Loading module</p>
    </div>
  );
}