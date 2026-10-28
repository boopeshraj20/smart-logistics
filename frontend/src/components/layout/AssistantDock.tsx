import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  CornerDownLeft,
  Send,
  Sparkles,
  X,
  Truck,
  AlertTriangle,
  Package,
  TrendingUp,
  Calculator,
  Trash2,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';
import { useSettingsStore } from '@/state/settingsStore';
import {
  processCopilotQuery,
  estimateLogistics,
  type CopilotMessage,
  type CopilotContext,
} from '@/services/copilot';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/types';

let chatSeq = 0;
function nextId() {
  chatSeq += 1;
  return `msg-${chatSeq}`;
}

const QUICK_ACTIONS = [
  { label: 'Fleet Status', query: 'fleet status', icon: Truck },
  { label: 'Health Alerts', query: 'maintenance health check', icon: AlertTriangle },
  { label: 'Active Shipments', query: 'active shipments tracking', icon: Package },
  { label: 'Route Calculator', query: 'calculator estimate 350 km 4000 kg', icon: Calculator },
  { label: 'Demand Forecast', query: 'demand forecast next 14 days', icon: TrendingUp },
  { label: 'Toggle Demo', query: 'toggle demo mode', icon: Activity },
];

export default function AssistantDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      type: 'text',
      title: 'Lumina Logistics Copilot',
      text: 'Hello! I am connected to your live fleet and dispatch network. You can query fleet health, track shipments, estimate trip economics, or ask how-to questions.',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const vehicles = useFleetStore((s) => s.vehicles);
  const selectVehicle = useFleetStore((s) => s.select);
  const shipments = useShipmentsStore((s) => s.shipments);
  const demoMode = useSettingsStore((s) => s.demoMode);
  const presentationMode = useSettingsStore((s) => s.presentationMode);
  const toggleDemoMode = useSettingsStore((s) => s.toggleDemoMode);
  const togglePresentationMode = useSettingsStore((s) => s.togglePresentationMode);

  const context: CopilotContext = {
    vehicles,
    shipments,
    demoMode,
    presentationMode,
    toggleDemoMode,
    togglePresentationMode,
    selectVehicle,
    navigate,
  };

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  function handleNavigate(to: string) {
    setOpen(false);
    navigate(to);
  }

  function handleInspectVehicle(vehicleId: string) {
    selectVehicle(vehicleId);
    setOpen(false);
    navigate('/fleet');
  }

  function handleSend(raw: string) {
    const query = raw.trim();
    if (!query) return;

    setInput('');
    const userMsg: CopilotMessage = {
      id: nextId(),
      role: 'user',
      type: 'text',
      text: query,
    };

    const reply = processCopilotQuery(query, context);
    const assistantMsg: CopilotMessage = {
      id: nextId(),
      role: 'assistant',
      ...reply,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }

  function clearHistory() {
    setMessages([
      {
        id: nextId(),
        role: 'assistant',
        type: 'text',
        title: 'Conversation Cleared',
        text: 'Ready for new queries. How can I assist you with your logistics operations?',
      },
    ]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.175, 0.885, 0.32, 1.02] }}
            className="glass-strong flex h-[530px] w-[350px] sm:w-[410px] flex-col overflow-hidden rounded-[var(--r-xl)] border border-[var(--border-h)] shadow-[var(--shadow-xl)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-surface/50 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/30">
                  <Bot className="size-4" />
                  <span className="absolute bottom-0 right-0 size-2 rounded-full bg-success ring-2 ring-abyss" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-ink">Lumina Copilot</p>
                    <span className="rounded bg-accent/15 px-1.5 py-0.2 text-[9px] font-semibold uppercase text-accent">
                      AI Live
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    {vehicles.length} Trucks · {shipments.length} Orders Synced
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearHistory}
                  title="Clear conversation"
                  aria-label="Clear chat"
                  className="focus-ring flex size-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-h hover:text-ink"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close copilot"
                  className="focus-ring flex size-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-h hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--border)]/40 bg-surface/20 px-3 py-2 scrollbar-none">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleSend(action.query)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)] bg-surface-h/30 px-2.5 py-1 text-[11px] font-medium text-ink-mid transition-all hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                  >
                    <Icon className="size-3" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Message Feed */}
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4 scrollbar-thin">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-[var(--r-md)] text-xs leading-relaxed transition-all',
                    m.role === 'user'
                      ? 'ml-8 bg-accent-soft border border-accent/20 px-3.5 py-2.5 text-ink'
                      : 'glass mr-2 border border-[var(--border)] bg-surface/60 p-3 text-ink-mid',
                  )}
                >
                  {/* Assistant Title header */}
                  {m.role === 'assistant' && m.title && (
                    <div className="mb-2 flex items-center justify-between border-b border-[var(--border)]/40 pb-1.5">
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        <Sparkles className="size-3 text-accent" />
                        {m.title}
                      </span>
                    </div>
                  )}

                  {/* Standard text content */}
                  {m.text && <p className="leading-relaxed">{m.text}</p>}

                  {/* 1. Fleet Status Card */}
                  {m.type === 'fleet_status' && m.data && (
                    <div className="mt-2.5 space-y-2 rounded-lg bg-surface-h/40 p-2.5">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md bg-surface p-1.5">
                          <p className="text-[10px] text-ink-faint">Available</p>
                          <p className="text-sm font-bold text-success">{m.data.available}</p>
                        </div>
                        <div className="rounded-md bg-surface p-1.5">
                          <p className="text-[10px] text-ink-faint">In-Transit</p>
                          <p className="text-sm font-bold text-accent">{m.data.inTransit}</p>
                        </div>
                        <div className="rounded-md bg-surface p-1.5">
                          <p className="text-[10px] text-ink-faint">Maintenance</p>
                          <p className="text-sm font-bold text-amber">{m.data.maintenance}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {Object.entries(m.data.typeCounts as Record<string, number>).map(
                          ([type, count]) => (
                            <span
                              key={type}
                              className="rounded bg-surface px-2 py-0.5 text-[10px] text-ink-muted"
                            >
                              {type}: {count}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Health & Maintenance Alert Card */}
                  {m.type === 'health_alert' && m.data && (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center justify-between rounded-md bg-surface p-2">
                        <span className="text-[11px] text-ink-muted">Fleet Avg Health:</span>
                        <span
                          className={cn(
                            'font-bold',
                            m.data.avgHealth >= 80 ? 'text-success' : 'text-amber',
                          )}
                        >
                          {m.data.avgHealth}%
                        </span>
                      </div>

                      {m.data.atRisk?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber">
                            Vehicles Requiring Service:
                          </p>
                          {m.data.atRisk.slice(0, 3).map((v: Vehicle) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between rounded-md border border-amber/20 bg-amber-soft/20 p-2 text-[11px]"
                            >
                              <div>
                                <p className="font-semibold text-ink">{v.name}</p>
                                <p className="text-[10px] text-ink-faint">{v.plateNumber}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-danger">{v.healthScore}% health</span>
                                <button
                                  type="button"
                                  onClick={() => handleInspectVehicle(v.id)}
                                  className="rounded bg-surface px-2 py-1 text-[10px] font-medium text-accent hover:bg-surface-h"
                                >
                                  Inspect
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Shipment Summary Card */}
                  {m.type === 'shipment_summary' && m.data && (
                    <div className="mt-2.5 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md bg-surface p-1.5">
                          <p className="text-[10px] text-ink-faint">Planned</p>
                          <p className="text-sm font-bold text-ink">{m.data.planned}</p>
                        </div>
                        <div className="rounded-md bg-surface p-1.5">
                          <p className="text-[10px] text-ink-faint">In-Transit</p>
                          <p className="text-sm font-bold text-accent">{m.data.inTransit}</p>
                        </div>
                        <div className="rounded-md bg-surface p-1.5">
                          <p className="text-[10px] text-ink-faint">Delivered</p>
                          <p className="text-sm font-bold text-success">{m.data.delivered}</p>
                        </div>
                      </div>

                      {m.data.recent?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                            Recent Active Shipments:
                          </p>
                          {m.data.recent.slice(0, 3).map((s: any) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between rounded-md bg-surface p-2 text-[11px]"
                            >
                              <span className="font-mono font-medium text-ink">{s.reference}</span>
                              <span className="text-ink-muted">
                                {s.pickup.city || 'Origin'} → {s.destination.city || 'Dest'}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[9px] uppercase font-semibold',
                                  s.status === 'in-transit'
                                    ? 'bg-accent-soft text-accent'
                                    : s.status === 'delivered'
                                      ? 'bg-success-soft text-success'
                                      : 'bg-surface-h text-ink-muted',
                                )}
                              >
                                {s.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Interactive Calculator Card */}
                  {m.type === 'calculator' && m.data && (
                    <InteractiveCalculator initialDist={m.data.distanceKm} initialWeight={m.data.weightKg} />
                  )}

                  {/* 5. Guide Answer Card */}
                  {m.type === 'guide' && m.guide && (
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent">
                        <Sparkles className="size-3" />
                        {m.guide.topic.section} · Official Guide
                      </div>
                      <p className="leading-relaxed text-ink-mid">{m.guide.topic.answer}</p>
                      {m.guide.topic.link && (
                        <button
                          type="button"
                          onClick={() => handleNavigate(m.guide!.topic.link!.to)}
                          className="mt-1.5 flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                        >
                          <CornerDownLeft className="size-3" />
                          {m.guide.topic.link.label}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Link Button if provided */}
                  {m.action?.to && (
                    <button
                      type="button"
                      onClick={() => handleNavigate(m.action!.to!)}
                      className="mt-2.5 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-h"
                    >
                      <span>{m.action.label}</span>
                      <ChevronRight className="size-3" />
                    </button>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2 border-t border-[var(--border)] bg-surface/40 p-3 backdrop-blur-md"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fleet, health, orders, cost..."
                aria-label="Ask Lumina Copilot"
                className="focus-ring h-9 flex-1 rounded-[var(--r-md)] border border-[var(--border)] bg-surface-h/40 px-3 text-xs text-ink placeholder:text-ink-faint transition-colors focus:border-accent"
              />
              <button
                type="submit"
                aria-label="Send query"
                disabled={!input.trim()}
                className="focus-ring flex size-9 items-center justify-center rounded-[var(--r-md)] bg-accent text-white transition-all hover:bg-accent-h disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle Lumina AI Copilot"
        className="glass-strong focus-ring group relative flex size-[54px] items-center justify-center rounded-full text-accent shadow-[var(--shadow-lg)] transition-all hover:shadow-accent/20"
      >
        <Bot className="size-6 transition-transform group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 flex size-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex size-3.5 rounded-full bg-accent text-[9px] font-bold text-white items-center justify-center">
            ★
          </span>
        </span>
      </motion.button>
    </div>
  );
}

/** Interactive In-Chat Calculator Widget */
function InteractiveCalculator({
  initialDist,
  initialWeight,
}: {
  initialDist: number;
  initialWeight: number;
}) {
  const [dist, setDist] = useState(initialDist);
  const [weight, setWeight] = useState(initialWeight);

  const res = estimateLogistics(dist, weight);

  return (
    <div className="mt-2 space-y-2.5 rounded-lg border border-[var(--border)] bg-surface-h/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-ink-faint">Distance (km)</label>
          <input
            type="number"
            min={10}
            max={5000}
            value={dist}
            onChange={(e) => setDist(Math.max(1, Number(e.target.value) || 0))}
            className="focus-ring mt-0.5 h-7 w-full rounded border border-[var(--border)] bg-surface px-2 text-xs font-semibold text-ink"
          />
        </div>
        <div>
          <label className="text-[10px] text-ink-faint">Payload (kg)</label>
          <input
            type="number"
            min={50}
            max={25000}
            step={50}
            value={weight}
            onChange={(e) => setWeight(Math.max(1, Number(e.target.value) || 0))}
            className="focus-ring mt-0.5 h-7 w-full rounded border border-[var(--border)] bg-surface px-2 text-xs font-semibold text-ink"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-md bg-surface p-2 text-center">
        <div>
          <p className="text-[9px] text-ink-faint">Fuel</p>
          <p className="font-mono text-xs font-bold text-amber">{res.fuelL} L</p>
        </div>
        <div>
          <p className="text-[9px] text-ink-faint">Est. Cost</p>
          <p className="font-mono text-xs font-bold text-success">₹{res.costEstimate.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[9px] text-ink-faint">CO₂</p>
          <p className="font-mono text-xs font-bold text-danger">{res.co2Kg} kg</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-muted">
        <span>Recommended Class:</span>
        <span className="font-semibold text-accent">{res.recommendedType}</span>
      </div>
    </div>
  );
}
