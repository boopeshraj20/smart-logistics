import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Database, MonitorPlay, Palette, RefreshCw, Trash2, Zap } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { loadDemoDataset, resetToSeed } from '@/services/demoData';
import { listModels } from '@/services/ai';
import { firebaseEnabled } from '@/services/firebase';
import { config } from '@/services/config';
import { useSettingsStore } from '@/state/settingsStore';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[var(--dur-norm)] ${
        checked ? 'bg-accent' : 'bg-surface-sh'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { demoMode, setDemoMode, presentationMode, setPresentationMode } = useSettingsStore();
  const vehicles = useFleetStore((s) => s.vehicles.length);
  const shipments = useShipmentsStore((s) => s.shipments.length);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void listModels().then((models) => {
      if (active) setAiOnline(Boolean(models && models.length > 0));
    });
    return () => {
      active = false;
    };
  }, []);

  const adapter = firebaseEnabled ? 'Cloud Firestore' : 'Local browser storage';

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-sm text-ink-muted">Demo data, presentation mode and environment status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <SectionHeading
            title="Demo Mode"
            subtitle="Fill the app with realistic enterprise data"
            action={
              <div className="flex size-9 items-center justify-center rounded-[var(--r-sm)] bg-accent-soft text-accent">
                <Zap className="size-4" />
              </div>
            }
          />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Load demo dataset</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Replaces the fleet with 14 vehicles and 22 shipments across the last nine days.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                loadDemoDataset();
                setDemoMode(true);
              }}
            >
              <RefreshCw className="size-3.5" /> Load
            </Button>
          </div>
          <div className="rounded-[var(--r-md)] bg-surface px-4 py-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-mono text-lg font-semibold text-ink">{vehicles}</p>
                <p className="text-[11px] text-ink-faint">Vehicles</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-ink">{shipments}</p>
                <p className="text-[11px] text-ink-faint">Shipments</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-ink">{demoMode ? 'On' : 'Off'}</p>
                <p className="text-[11px] text-ink-faint">Demo mode</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Demo Mode toggle</p>
              <p className="mt-0.5 text-xs text-ink-muted">Applied from the top bar Demo switch.</p>
            </div>
            <Toggle checked={demoMode} onChange={setDemoMode} />
          </div>
          <Button
            variant="danger"
            size="sm"
            className="self-start"
            onClick={() => {
              resetToSeed();
            }}
          >
            <Trash2 className="size-3.5" /> Reset to starter seed
          </Button>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <SectionHeading
            title="Presentation Mode"
            subtitle="Fullscreen projector-ready dashboard"
            action={
              <div className="flex size-9 items-center justify-center rounded-[var(--r-sm)] bg-cyan-soft text-cyan">
                <MonitorPlay className="size-4" />
              </div>
            }
          />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Launch Presentation Mode</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Auto-advancing KPI slides on a clean canvas — press Esc to exit.
              </p>
            </div>
            <Toggle checked={presentationMode} onChange={setPresentationMode} />
          </div>
          <p className="text-[11px] text-ink-faint">
            Tip: also available from the top bar via the target icon for one-click demos.
          </p>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <SectionHeading
            title="Environment"
            subtitle="Runtime status"
            action={
              <div className="flex size-9 items-center justify-center rounded-[var(--r-sm)] bg-success-soft text-success">
                <Cloud className="size-4" />
              </div>
            }
          />
          <ul className="flex flex-col gap-2.5 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Database className="size-4 text-ink-faint" /> Persistence
              </span>
              <Badge variant={firebaseEnabled ? 'success' : 'info'} size="sm">{adapter}</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Zap className="size-4 text-ink-faint" /> AI service
              </span>
              <Badge variant={aiOnline === false ? 'warning' : aiOnline === null ? 'default' : 'success'} size="sm">
                {aiOnline === false ? 'Offline (client fallback)' : aiOnline === null ? 'Checking…' : 'Connected'}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Palette className="size-4 text-ink-faint" /> Build
              </span>
              <span className="font-mono text-xs text-ink-mid">v0.2.0 · Lumina</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">API base</span>
              <span className="font-mono text-xs text-ink-mid">{config.apiBase}</span>
            </li>
          </ul>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col gap-4">
          <SectionHeading
            title="In-app guide"
            subtitle="Ask how to use Lumina"
            action={
              <div className="flex size-9 items-center justify-center rounded-[var(--r-sm)] bg-violet-soft text-violet">
                <RefreshCw className="size-4" />
              </div>
            }
          />
          <p className="text-sm leading-relaxed text-ink-muted">
            Use the guide bubble in the bottom-right corner to ask how-to questions — adding vehicles,
            creating shipments, route optimization, AI forecasts, sustainability scoring and both modes.
            It only answers questions about using the application.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}