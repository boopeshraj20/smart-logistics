import { Fragment, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Inbox, Package, Plus, Search, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';
import { useSearchStore } from '@/state/searchStore';
import { formatCompact, formatDate } from '@/lib/utils';
import type { ShipmentStatus } from '@/types';

const STATUS_META: Record<ShipmentStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default' | 'neutral' }> = {
  planned: { label: 'Planned', variant: 'default' },
  assigned: { label: 'Assigned', variant: 'info' },
  'in-transit': { label: 'In Transit', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  delayed: { label: 'Delayed', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};

const FILTERS: { key: ShipmentStatus | 'all' | 'active'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'in-transit', label: 'In Transit' },
  { key: 'planned', label: 'Planned' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'delayed', label: 'Delayed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.175, 0.885, 0.32, 1.02] as const } },
};

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const shipments = useShipmentsStore((s) => s.shipments);
  const updateStatus = useShipmentsStore((s) => s.updateStatus);
  const vehicles = useFleetStore((s) => s.vehicles);
  const globalQuery = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const [filter, setFilter] = useState<ShipmentStatus | 'all' | 'active'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const vehicleName = (id?: string) => vehicles.find((v) => v.id === id)?.name ?? id ?? 'Unassigned';

  const filtered = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    return [...shipments]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((s) => {
        if (filter === 'all') return true;
        if (filter === 'active') return s.status === 'planned' || s.status === 'assigned' || s.status === 'in-transit';
        return s.status === filter;
      })
      .filter((s) => {
        if (!q) return true;
        const haystack = `${s.reference} ${s.pickup.name} ${s.destination.name} ${s.pickup.city} ${s.destination.city} ${vehicleName(s.assignedVehicleId)}`.toLowerCase();
        return haystack.includes(q);
      });
  }, [shipments, filter, globalQuery, vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const tally: Record<ShipmentStatus, number> = {
      planned: 0, assigned: 0, 'in-transit': 0, delivered: 0, delayed: 0, cancelled: 0,
    };
    for (const s of shipments) tally[s.status] += 1;
    return tally;
  }, [shipments]);

  const totals = useMemo(
    () => ({
      km: shipments.reduce((a, s) => a + (s.route?.distanceKm ?? 0), 0),
      co2: shipments.reduce((a, s) => a + (s.route?.co2EstimateKg ?? 0), 0),
      cost: shipments.reduce((a, s) => a + (s.costEstimate ?? 0), 0),
    }),
    [shipments],
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Shipments</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {shipments.length} orders · {formatCompact(totals.km)} km · ₹{formatCompact(totals.cost)} ·{' '}
            {formatCompact(totals.co2)} kg CO₂
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/routes')}>
          <Plus className="size-4" /> New Shipment
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {FILTERS.filter((f) => f.key !== 'all').map((f) => {
          const key = f.key as ShipmentStatus;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key as typeof filter)}
              className={`rounded-[var(--r-md)] border px-4 py-3 text-left transition-colors ${
                filter === f.key
                  ? 'border-accent/40 bg-accent-soft'
                  : 'border-[var(--border)] bg-surface hover:border-[var(--border-h)]'
              }`}
            >
              <p className="font-mono text-xl font-semibold text-ink">{counts[key]}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{f.label}</p>
            </button>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card variant="default" padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={globalQuery}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by reference, route or vehicle…"
                className="focus-ring h-9 w-full rounded-[var(--r-md)] border border-[var(--border)] bg-surface-h/40 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key as typeof filter)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f.key ? 'bg-accent-soft text-accent' : 'text-ink-faint hover:text-ink-mid'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-h text-ink-faint">
                <Inbox className="size-6" />
              </div>
              <p className="text-sm font-medium text-ink">No shipments found</p>
              <p className="max-w-[36ch] text-xs text-ink-muted">
                {globalQuery
                  ? 'Nothing matches your search. Try a reference like SH-D1, a city, or a vehicle name.'
                  : 'Create a route in the Route Optimizer and save it as a shipment.'}
              </p>
              {!globalQuery && filter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                  Show all shipments
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    <th className="pb-2.5 pl-4 pr-3 font-medium">Reference</th>
                    <th className="pb-2.5 pr-3 font-medium">Route</th>
                    <th className="pb-2.5 pr-3 font-medium">Status</th>
                    <th className="pb-2.5 pr-3 font-medium">Load</th>
                    <th className="pb-2.5 pr-3 font-medium">Distance</th>
                    <th className="pb-2.5 pr-3 font-medium">Cost</th>
                    <th className="pb-2.5 pr-3 font-medium">Vehicle</th>
                    <th className="pb-2.5 pr-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((shipment) => {
                    const meta = STATUS_META[shipment.status];
                    const open = expanded === shipment.id;
                    return (
                      <Fragment key={shipment.id}>
                        <tr
                          onClick={() => setExpanded(open ? null : shipment.id)}
                          className="cursor-pointer border-b border-[var(--border)]/50 transition-colors last:border-0 hover:bg-surface-h"
                        >
                          <td className="py-3 pl-4 pr-3">
                            <p className="text-sm font-medium text-ink">{shipment.reference}</p>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-1.5 text-sm text-ink-mid">
                              <span className="max-w-[120px] truncate">{shipment.pickup.name}</span>
                              <ArrowRight className="size-3 shrink-0 text-ink-faint" />
                              <span className="max-w-[120px] truncate">{shipment.destination.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                          </td>
                          <td className="py-3 pr-3 text-sm text-ink-mid">
                            {shipment.weightKg ? `${formatCompact(shipment.weightKg)} kg` : '—'}
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs text-ink-mid">
                            {shipment.route?.distanceKm ? `${shipment.route.distanceKm.toLocaleString()} km` : '—'}
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs text-ink-mid">
                            {shipment.costEstimate ? `₹${shipment.costEstimate.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 pr-3 text-sm text-ink-mid">{vehicleName(shipment.assignedVehicleId)}</td>
                          <td className="py-3 pr-4 text-xs text-ink-faint">{formatDate(shipment.createdAt)}</td>
                        </tr>
                        {open && (
                          <tr className="border-b border-[var(--border)]/50 bg-surface-h/40">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="flex flex-col gap-1 text-xs text-ink-muted">
                                  <span className="font-mono text-[11px] text-ink-faint">
                                    {shipment.stops.length} intermediate stops
                                  </span>
                                  <p>
                                    {[shipment.pickup, ...shipment.stops, shipment.destination]
                                      .map((s) => s.name)
                                      .join(' → ')}
                                  </p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="rounded-[var(--r-sm)] bg-surface px-2 py-2">
                                    <p className="font-mono text-sm font-semibold text-ink">
                                      {shipment.route ? `${Math.round(shipment.route.durationMin / 60)}h` : '—'}
                                    </p>
                                    <p className="text-[10px] text-ink-faint">Duration</p>
                                  </div>
                                  <div className="rounded-[var(--r-sm)] bg-surface px-2 py-2">
                                    <p className="font-mono text-sm font-semibold text-ink">
                                      {shipment.route ? `${shipment.route.fuelEstimateL} L` : '—'}
                                    </p>
                                    <p className="text-[10px] text-ink-faint">Fuel</p>
                                  </div>
                                  <div className="rounded-[var(--r-sm)] bg-surface px-2 py-2">
                                    <p className="font-mono text-sm font-semibold text-ink">
                                      {shipment.route ? `${shipment.route.co2EstimateKg} kg` : '—'}
                                    </p>
                                    <p className="text-[10px] text-ink-faint">CO₂</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-start justify-end gap-2">
                                  <Badge variant={shipment.route?.provider === 'ors' ? 'info' : 'warning'} size="sm">
                                    {shipment.route?.provider === 'ors' ? 'Road geometry' : 'Straight-line estimate'}
                                  </Badge>
                                  {(shipment.status === 'planned' || shipment.status === 'in-transit') && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus(shipment.id, 'delivered');
                                      }}
                                    >
                                      <CheckCircle2 className="size-3.5" /> Mark delivered
                                    </Button>
                                  )}
                                  {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus(shipment.id, 'cancelled');
                                      }}
                                    >
                                      <XCircle className="size-3.5" /> Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-2 text-[11px] text-ink-faint">
        <Package className="size-3.5" />
        Expand a row to inspect route detail and transition status. New orders are created in the Route Optimizer.
      </motion.div>
    </motion.div>
  );
}