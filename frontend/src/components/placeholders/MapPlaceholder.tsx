import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

export default function MapPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] }}
      className="glass-accent relative flex h-[280px] flex-col items-center justify-center gap-3 overflow-hidden p-6"
    >
      <svg viewBox="0 0 400 180" className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(79,140,255,0.10)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="180" fill="url(#grid)" />
        <path
          d="M 30 150 C 90 150, 110 60, 180 55 S 300 130, 372 30"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 7"
        />
        <circle cx="30" cy="150" r="5" fill="var(--accent)" />
        <circle cx="372" cy="30" r="5" fill="var(--success)" />
      </svg>
      <div className="relative flex items-center gap-2 rounded-full bg-abyss/70 px-3 py-1.5">
        <MapPin className="size-3.5 text-accent" />
        <span className="text-xs text-ink-mid">Chennai → Bangalore</span>
        <Navigation className="size-3.5 text-cyan" />
      </div>
      <div className="relative text-center">
        <p className="text-sm font-medium text-ink-mid">Route Optimization Map</p>
        <p className="mt-1 text-xs text-ink-faint">Leaflet + real road routing · Phase 4</p>
      </div>
    </motion.div>
  );
}