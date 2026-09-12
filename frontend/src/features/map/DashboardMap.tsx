import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Marker, Polyline } from 'react-leaflet';

import BaseMap from '@/features/map/BaseMap';
import { dotIcon } from '@/features/map/markers';
import { optimizeRoute, straightLineGeometry } from '@/services/routing';
import { useShipmentsStore } from '@/state/shipmentsStore';
import type { GeoPoint } from '@/types';

const START: GeoPoint = { lat: 13.0827, lng: 80.2707 };
const DEST: GeoPoint = { lat: 12.9716, lng: 77.5946 };

function sampleAlong(geometry: GeoPoint[], count: number): GeoPoint[] {
  if (geometry.length === 0) return [];
  const picks: GeoPoint[] = [];
  for (let i = 1; i <= count; i += 1) {
    const idx = Math.floor((geometry.length * i) / (count + 1));
    picks.push(geometry[Math.min(idx, geometry.length - 1)]);
  }
  return picks;
}

export default function DashboardMap() {
  const shipments = useShipmentsStore((s) => s.shipments);
  const latest = shipments[0];
  const latestRoute = latest?.route?.geometry;
  const hasRoute = !!latestRoute && latestRoute.length > 1;

  const [fetched, setFetched] = useState<GeoPoint[]>([]);

  const corridor =
    hasRoute && latest
      ? {
          start: latest.pickup.location,
          dest: latest.destination.location,
          label: latest.reference,
        }
      : { start: START, dest: DEST, label: 'Chennai → Bangalore' };

  const route = hasRoute && latestRoute ? latestRoute : fetched;

  useEffect(() => {
    if (hasRoute) return;
    let alive = true;
    optimizeRoute({
      start: { name: 'Chennai Warehouse', location: START },
      stops: [],
      destination: { name: 'Bangalore DC', location: DEST },
      profile: 'driving-hgv',
      reorderStops: true,
      weightKg: 4000,
    })
      .then((r) => {
        if (alive) setFetched(r.geometry);
      })
      .catch(() => {
        if (alive) setFetched(straightLineGeometry(START, DEST));
      });
    return () => {
      alive = false;
    };
  }, [hasRoute, latestRoute]);

  const fleetDots = useMemo(() => sampleAlong(route, 3), [route]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.02] }}
      className="glass flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-sm font-semibold text-ink">Live Corridor</p>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ink-faint">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-success" />
          {corridor.label}
        </span>
      </div>
      <div className="relative h-[236px] p-3">
        <BaseMap
          fitPoints={[
            [corridor.start.lat, corridor.start.lng],
            [corridor.dest.lat, corridor.dest.lng],
          ]}
          className="h-full w-full overflow-hidden"
        >
          <Marker position={[corridor.start.lat, corridor.start.lng]} icon={dotIcon('#34d399')} />
          {fleetDots.map((p, i) => (
            <Marker key={i} position={[p.lat, p.lng]} icon={dotIcon('#4f8cff')} />
          ))}
          <Marker position={[corridor.dest.lat, corridor.dest.lng]} icon={dotIcon('#8b7cf6')} />
          {route.length > 1 && (
            <Polyline
              positions={route.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#4f8cff', weight: 3.5, opacity: 0.85, dashArray: '2 8' }}
            />
          )}
        </BaseMap>
      </div>
    </motion.div>
  );
}