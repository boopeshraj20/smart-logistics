import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, HeartPulse, MonitorPlay, Package, Truck, X } from 'lucide-react';

import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';
import { useSettingsStore } from '@/state/settingsStore';
import DemandForecastPanel from '@/features/ai/DemandForecastPanel';
import FleetHealthTable from '@/features/dashboard/FleetHealthTable';
import FleetStatusDonut from '@/features/dashboard/FleetStatusDonut';
import CarbonEmissionsChart from '@/features/dashboard/CarbonEmissionsChart';
import FuelEfficiencyChart from '@/features/dashboard/FuelEfficiencyChart';
import DashboardMap from '@/features/map/DashboardMap';
import { formatCompact } from '@/lib/utils';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  render: () => React.ReactNode;
}

const SLIDE_MS = 7000;

const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

export default function PresentationDashboard() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useShipmentsStore((s) => s.shipments);
  const setPresentationMode = useSettingsStore((s) => s.setPresentationMode);
  const [index, setIndex] = useState(0);

  const available = vehicles.filter((v) => v.available && v.status === 'available').length;
  const activeShipments = shipments.filter((s) => s.status !== 'delivered' && s.status !== 'cancelled').length;
  const fleetHealth = vehicles.length
    ? Math.round(vehicles.reduce((s, v) => s + v.healthScore, 0) / vehicles.length)
    : 0;
  const totals = useMemo(
    () =>
      shipments.reduce(
        (acc, s) => ({
          km: acc.km + (s.route?.distanceKm ?? 0),
          co2: acc.co2 + (s.route?.co2EstimateKg ?? 0),
        }),
        { km: 0, co2: 0 },
      ),
    [shipments],
  );

  const kpis = [
    { label: 'Total Fleet', value: String(vehicles.length), icon: Truck, tone: 'text-accent' },
    { label: 'Available', value: String(available), icon: CheckCircle2, tone: 'text-success' },
    { label: 'Active Shipments', value: String(activeShipments), icon: Package, tone: 'text-cyan' },
    { label: 'Fleet Health', value: `${fleetHealth}%`, icon: HeartPulse, tone: 'text-violet' },
    { label: 'Distance Planned', value: `${formatCompact(totals.km)} km`, icon: Truck, tone: 'text-amber' },
    { label: 'Planned CO₂', value: `${formatCompact(totals.co2)} kg`, icon: HeartPulse, tone: 'text-danger' },
  ];

  const slides: Slide[] = [
    {
      id: 'kpi',
      title: 'Command Center',
      subtitle: 'Fleet, shipments and health at a glance',
      render: () => (
        <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-3" style={{ gridAutoRows: 'minmax(0,1fr)' }}>
          {kpis.map((k) => (
            <div key={k.label} className="glass flex flex-col items-center justify-center gap-1 p-6 text-center">
              <k.icon className={`size-6 ${k.tone}`} />
              <p className="text-4xl font-bold tracking-tight text-ink md:text-5xl">{k.value}</p>
              <p className="text-sm uppercase tracking-[0.18em] text-ink-faint">{k.label}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'forecast',
      title: 'AI Demand Forecast',
      subtitle: '14-day projection with confidence band · explainable by feature',
      render: () => (
        <div className="w-full">
          <DemandForecastPanel />
        </div>
      ),
    },
    {
      id: 'health',
      title: 'Predictive Maintenance',
      subtitle: 'Fleet health scores and status breakdown',
      render: () => (
        <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="min-w-0 overflow-hidden">
            <FleetHealthTable />
          </div>
          <div className="flex items-center justify-center">
            <FleetStatusDonut />
          </div>
        </div>
      ),
    },
    {
      id: 'sustainability',
      title: 'Green Logistics',
      subtitle: 'Fuel efficiency and carbon footprint across the fleet',
      render: () => (
        <div className="grid h-full grid-cols-1 gap-4 xl:grid-cols-2">
          <CarbonEmissionsChart />
          <FuelEfficiencyChart />
        </div>
      ),
    },
    {
      id: 'map',
      title: 'Live Corridor Map',
      subtitle: 'Latest optimized route across the road network',
      render: () => (
        <div className="h-full w-full overflow-hidden">
          <DashboardMap />
        </div>
      ),
    },
  ];

  const active = slides[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresentationMode(false);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % slides.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + slides.length) % slides.length);
    };
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearInterval(timer);
    };
  }, [setPresentationMode, slides.length]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(79,140,255,0.14),transparent),var(--void)]">
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--r-md)] bg-accent-soft text-accent">
            <MonitorPlay className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-wide text-ink">Lumina Logistics</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">Presentation Mode</p>
          </div>
        </div>
        <button
          onClick={() => setPresentationMode(false)}
          aria-label="Exit presentation mode"
          className="focus-ring flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <X className="size-4" /> Exit <span className="font-mono text-[10px] text-ink-faint">Esc</span>
        </button>
      </header>

      <main className="relative flex min-h-0 flex-1 px-8 pb-4">
        <AnimatePresence mode="wait">
          <motion.section
            key={active.id}
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.99 }}
            transition={transition}
            className="flex min-h-0 w-full flex-col gap-4"
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{active.title}</h2>
              <p className="mt-1 text-sm text-ink-muted md:text-base">{active.subtitle}</p>
            </div>
            <div className="flex min-h-0 flex-1 items-center">{active.render()}</div>
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-accent' : 'w-4 bg-surface-sh hover:bg-border-h'
              }`}
            />
          ))}
        </div>
        <p className="font-mono text-xs text-ink-faint">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} · auto-advances
        </p>
      </footer>
    </div>
  );
}