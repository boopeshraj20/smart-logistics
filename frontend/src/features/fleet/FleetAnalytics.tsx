import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge, Leaf, Navigation, Wallet, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';
import { clamp, formatCompact, formatINR } from '@/lib/utils';
import type { Vehicle } from '@/types';

function kpiList(vehicles: Vehicle[], usedCapacityKg: number, shipmentCost: number, shipmentCo2Kg: number) {
  const totalCap = vehicles.reduce((s, v) => s + v.capacityKg, 0);
  const odometer = vehicles.reduce((s, v) => s + v.currentOdometerKm, 0);
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
  const utilization = totalCap > 0 ? clamp(Math.round((usedCapacityKg / totalCap) * 100), 0, 100) : 0;

  return [
    {
      label: 'Fleet Utilization',
      value: `${utilization}%`,
      sub: `${formatCompact(usedCapacityKg)} kg of ${formatCompact(totalCap)} kg capacity`,
      icon: Activity,
      accent: 'bg-accent-soft text-accent',
    },
    {
      label: 'Distance Travelled',
      value: `${formatCompact(odometer)} km`,
      sub: 'fleet odometer (life-cycle)',
      icon: Navigation,
      accent: 'bg-cyan-soft text-cyan',
    },
    {
      label: 'Est. Operating Cost',
      value: formatINR(shipmentCost),
      sub: 'tracked shipments only',
      icon: Wallet,
      accent: 'bg-amber-soft text-amber',
    },
    {
      label: 'CO₂ Estimate',
      value: `${formatCompact(shipmentCo2Kg)} kg`,
      sub: 'from tracked shipments',
      icon: Leaf,
      accent: 'bg-success-soft text-success',
    },
    {
      label: 'Maintenance',
      value: `${maintenance}`,
      sub: vehicles.length > 0 ? 'vehicles in service bay' : 'no vehicles yet',
      icon: Wrench,
      accent: 'bg-violet-soft text-violet',
    },
  ];
}

/**
 * Phase 5 — Fleet Analytics.
 * Every metric is derived at render time from the user's *own* fleet config and
 * saved shipments, so numbers adapt as vehicles are added, edited or removed.
 */
export default function FleetAnalytics() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useShipmentsStore((s) => s.shipments);

  const computed = useMemo(() => {
    const usedCapacityKg = shipments.reduce((s, x) => s + (x.weightKg ?? 0), 0);
    const shipmentCost = shipments.reduce((s, x) => s + (x.costEstimate ?? 0), 0);
    const shipmentCo2Kg = shipments.reduce((s, x) => s + (x.route?.co2EstimateKg ?? 0), 0);

    const perVehicle = vehicles
      .map((v) => {
        const sinceService = Math.max(0, v.currentOdometerKm - v.lastMaintenanceKm);
        const windowPct = clamp(Math.round((sinceService / Math.max(v.maintenanceIntervalKm, 1)) * 100), 0, 100);
        return {
          name: v.name,
          plate: v.plateNumber,
          type: v.type,
          pct: windowPct,
          remainingKm: Math.max(0, v.maintenanceIntervalKm - sinceService),
          status: v.status,
        };
      })
      .sort((a, b) => b.pct - a.pct);

    return {
      kpis: kpiList(vehicles, usedCapacityKg, shipmentCost, shipmentCo2Kg),
      perVehicle,
      usedCapacityKg,
      totalCapacityKg: vehicles.reduce((s, v) => s + v.capacityKg, 0),
    };
  }, [vehicles, shipments]);

  if (vehicles.length === 0) {
    return (
      <Card padding="md" className="flex min-h-[180px] items-center justify-center text-sm text-ink-faint">
        Add a vehicle to unlock adaptive fleet analytics.
      </Card>
    );
  }

  const barColor = (pct: number) => (pct >= 90 ? 'var(--danger)' : pct >= 65 ? 'var(--amber)' : 'var(--accent)');

  return (
    <motion.div className="flex flex-col gap-4">
      <SectionHeading
        title="Fleet Analytics"
        subtitle="Adaptive KPIs derived from your fleet configuration and saved shipments"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {computed.kpis.map((k) => (
          <Card key={k.label} padding="sm" className="flex flex-col gap-2.5">
            <div className={`flex size-9 items-center justify-center rounded-[var(--r-sm)] ${k.accent}`}>
              <k.icon className="size-4.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-bold tracking-tight text-ink">{k.value}</span>
              <span className="text-[11px] font-medium text-ink-muted">{k.label}</span>
              <span className="text-[10px] text-ink-faint">{k.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="sm" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Gauge className="size-4 text-ink-faint" />
            Service-life utilisation by vehicle
          </span>
          <span className="text-[10px] text-ink-faint">km since last service ÷ service interval</span>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={computed.perVehicle} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#5b6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: '#c0c7d6', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  background: 'rgba(9,11,19,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#e8ecf4' }}
                formatter={(value) => [`${value}% service window used`]}
              />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={12}>
                {computed.perVehicle.map((row) => (
                  <Cell key={row.plate} fill={barColor(row.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}