import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Plus, RotateCcw, Truck, X, Zap } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LogisticsMap, { type MapStopItem } from '@/features/map/LogisticsMap';
import LocationField from '@/features/route/LocationField';
import RouteResultPanel from '@/features/route/RouteResultPanel';
import { useFleetStore } from '@/state/fleetStore';
import { nextReference, useShipmentsStore } from '@/state/shipmentsStore';
import { planAssignmentResilient, reverseGeocode, type OptimizePayload } from '@/services/routing';
import { uid } from '@/lib/utils';
import type { AssignPlanResult, RouteResult, Shipment, Stop } from '@/types';

type PickKey = 'start' | 'destination' | `stop-${string}`;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

export default function RouteBuilderPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useShipmentsStore((s) => s.shipments);
  const addShipment = useShipmentsStore((s) => s.addShipment);

  const [start, setStart] = useState<Stop | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [destination, setDestination] = useState<Stop | null>(null);
  const [weightKg, setWeightKg] = useState('4000');
  const [profile, setProfile] = useState<'driving-hgv' | 'driving-car'>('driving-hgv');
  const [pickingFor, setPickingFor] = useState<PickKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [assign, setAssign] = useState<AssignPlanResult | null>(null);
  const [offline, setOffline] = useState(false);
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const ready = Boolean(start && destination);

  function setStopFor(key: PickKey, stop: Stop) {
    if (key === 'start') setStart(stop);
    else if (key === 'destination') setDestination(stop);
    else setStops((prev) => prev.map((s) => (s.id === key.replace('stop-', '') ? stop : s)));
    setPickingFor(null);
    setSaved(false);
  }

  function removeStop(id: string) {
    setStops((prev) => prev.filter((s) => s.id !== id));
    if (pickingFor === `stop-${id}`) setPickingFor(null);
    setSaved(false);
  }

  function moveStop(index: number, dir: -1 | 1) {
    setStops((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  }

  async function handleMapClick(latlng: { lat: number; lng: number }) {
    if (!pickingFor) return;
    let label = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    try {
      label = await reverseGeocode(latlng.lat, latlng.lng);
    } catch {
      /* keeps coordinate fallback */
    }
    const stop: Stop = { id: uid('loc'), name: label, city: '', location: latlng };
    setStopFor(pickingFor, stop);
  }

  async function runOptimize() {
    if (!start || !destination) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    setOffline(false);
    setOfflineReason(null);

    const payload: OptimizePayload = {
      start,
      stops,
      destination,
      profile,
      reorderStops: true,
      weightKg: Number(weightKg) || 0,
    };

    try {
      const plan = await planAssignmentResilient(start, stops, destination, payload.weightKg, profile, vehicles);
      setAssign(plan);
      setResult(plan.route);
      setOffline(plan.offline);
      setOfflineReason(plan.offlineReason ?? null);
    } catch (firstErr) {
      const message = firstErr instanceof Error ? firstErr.message : 'Optimization failed';
      setError(message);
      setResult(null);
      setAssign(null);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStart(null);
    setStops([]);
    setDestination(null);
    setWeightKg('4000');
    setProfile('driving-hgv');
    setResult(null);
    setAssign(null);
    setOffline(false);
    setOfflineReason(null);
    setError(null);
    setPickingFor(null);
    setSaved(false);
  }

  function saveShipment() {
    if (!start || !destination || !result) return;
    const ordered = (result.orderedWaypoints ?? []).map((w, i) => ({
      id: `loc-${i}`,
      name: w.name,
      city: '',
      location: w.location,
    }));
    const reference = nextReference(shipments, uid('sh'));
    const shipment: Shipment = {
      id: uid('sh'),
      reference,
      pickup: start,
      stops: ordered.length > 0 ? ordered : stops,
      destination,
      createdAt: new Date().toISOString(),
      status: 'planned',
      weightKg: Number(weightKg) || undefined,
      costEstimate: result.costEstimate,
      assignedVehicleId: assign?.recommended?.vehicleId,
      route: result,
    };
    addShipment(shipment);
    setSaved(true);
  }

  const mapItems: MapStopItem[] = start
    ? [
        { stop: start, role: 'start' },
        ...stops.map((s) => ({ stop: s, role: 'stop' as const })),
        destination ? { stop: destination, role: 'destination' as const } : null,
      ].filter((x): x is MapStopItem => x !== null)
    : [];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Route Optimizer</h1>
          <p className="mt-1 text-sm text-ink-muted">Plan corridors, pick the best vehicle, and track your CO₂ footprint</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="info" className="gap-1.5">
            <Zap className="size-3" />
            Phase 4
          </Badge>
          <Badge variant="neutral">Heuristic MVP</Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,_440px),_minmax(0,_1fr)]">
        {/* Left column: builder + results */}
        <div className="flex flex-col gap-5">
          <motion.div variants={fadeUp} className="glass flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Trip Setup</p>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            </div>

            <LocationField
              label="Start location"
              value={start}
              picking={pickingFor === 'start'}
              onStartPick={() => setPickingFor((p) => (p === 'start' ? null : 'start'))}
              onChange={(s) => {
                setStart(s);
                setSaved(false);
              }}
            />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  Stops on route
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const id = uid('stop');
                    setStops((prev) => [
                      ...prev,
                      { id, name: '', city: '', location: { lat: 0, lng: 0 } },
                    ]);
                  }}
                  className="flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent-h"
                >
                  <Plus className="size-3" />
                  Add stop
                </button>
              </div>

              {stops.length === 0 && (
                <p className="rounded-[var(--r-sm)] border border-dashed border-[var(--border)] px-3 py-2.5 text-xs text-ink-faint">
                  No intermediate stops — straight through to destination.
                </p>
              )}

              {stops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <LocationField
                      label={`Stop ${index + 1}`}
                      value={stop.location.lat === 0 ? null : stop}
                      picking={pickingFor === `stop-${stop.id}`}
                      onStartPick={() =>
                        setPickingFor((p) => (p === `stop-${stop.id}` ? null : `stop-${stop.id}`))
                      }
                      onChange={(s) => {
                        setStops((prev) =>
                          prev.map((x) => (x.id === stop.id ? (s ?? { ...stop, name: '' }) : x)),
                        );
                        setSaved(false);
                      }}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveStop(index, -1)}
                        className="flex size-6 items-center justify-center rounded-[var(--r-xs)] border border-[var(--border)] text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === stops.length - 1}
                        onClick={() => moveStop(index, 1)}
                        className="flex size-6 items-center justify-center rounded-[var(--r-xs)] border border-[var(--border)] text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(stop.id)}
                      className="flex size-6 items-center justify-center rounded-[var(--r-xs)] border border-[var(--border)] text-ink-faint transition-colors hover:border-danger/40 hover:text-danger"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <LocationField
              label="Destination"
              value={destination}
              picking={pickingFor === 'destination'}
              onStartPick={() => setPickingFor((p) => (p === 'destination' ? null : 'destination'))}
              onChange={(s) => {
                setDestination(s);
                setSaved(false);
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">Load weight</span>
                <div className="flex h-9 items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-2.5">
                  <Truck className="size-3.5 shrink-0 text-ink-faint" />
                  <input
                    value={weightKg}
                    onChange={(e) => {
                      setWeightKg(e.target.value.replace(/[^\d]/g, ''));
                      setSaved(false);
                    }}
                    inputMode="numeric"
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                  />
                  <span className="shrink-0 text-[10px] text-ink-faint">kg</span>
                </div>
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">Vehicle class</span>
                <div className="flex h-9 gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface p-1">
                  {(['driving-hgv', 'driving-car'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setProfile(p);
                        setSaved(false);
                      }}
                      className={`flex-1 rounded-[var(--r-xs)] text-xs font-medium transition-colors ${
                        profile === p ? 'bg-accent-soft text-accent' : 'text-ink-faint hover:text-ink-mid'
                      }`}
                    >
                      {p === 'driving-hgv' ? 'Heavy' : 'Light'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-[var(--r-sm)] border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <Button onClick={runOptimize} loading={loading} disabled={!ready} className="w-full">
              {ready ? (
                <>
                  <Zap className="size-4" />
                  Optimize Route
                </>
              ) : (
                <>
                  <MapPin className="size-4" />
                  Choose start &amp; destination
                </>
              )}
            </Button>
          </motion.div>

          <motion.div variants={fadeUp}>
            {saved && result && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-2 rounded-[var(--r-sm)] border border-success/30 bg-success-soft px-3 py-2 text-xs text-success"
              >
                <Check className="size-3.5" />
                Shipment saved to the operations board.
              </motion.div>
            )}
            {offline && result && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-3 py-2 text-xs text-ink-mid"
              >
                <Zap className="size-3.5 text-accent" />
                {offlineReason
                  ? `Backend unreachable (${offlineReason}) — showing straight-line estimate, no live route.`
                  : 'Offline estimate — road network / fleet service unreachable, using straight-line plan.'}
              </motion.div>
            )}
            <RouteResultPanel result={result} assign={assign} onSave={saveShipment} />
          </motion.div>
        </div>

        {/* Right column: map */}
        <motion.div variants={fadeUp} className="glass overflow-hidden xl:sticky xl:top-0">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-2">
              {mapItems.length > 0 ? (
                mapItems.slice(0, 3).map((item, i) => (
                  <Badge key={i} size="sm" variant={item.role === 'start' ? 'success' : item.role === 'destination' ? 'info' : 'default'}>
                    {item.stop.name || `Stop ${i}`}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-ink-faint">Pick locations or click the map to plot points</span>
              )}
            </div>
            <span className="font-mono text-[10px] text-ink-faint">
              {profile === 'driving-hgv' ? 'HGV' : 'Car'} · India
            </span>
          </div>
          <div className="p-3">
            <LogisticsMap
              items={mapItems}
              route={result?.geometry}
              onMapClick={handleMapClick}
              className="h-[560px] w-full overflow-hidden"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 px-4 pb-3.5">
            <LegendDot color="#34d399" label="Start" />
            <LegendDot color="#4f8cff" label="Stops" />
            <LegendDot color="#8b7cf6" label="Destination" />
            <span className="ml-auto font-mono text-[10px] text-ink-faint">OSM · OpenRouteService</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}