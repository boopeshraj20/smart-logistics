import { Marker, Polyline, Popup } from 'react-leaflet';

import BaseMap from '@/features/map/BaseMap';
import { stopIcon, type MarkerRole } from '@/features/map/markers';
import type { GeoPoint, Stop } from '@/types';

export interface MapStopItem {
  stop: Stop;
  role: MarkerRole;
}

interface LogisticsMapProps {
  items: MapStopItem[];
  route?: GeoPoint[];
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  className?: string;
}

export default function LogisticsMap({ items, route, onMapClick, className }: LogisticsMapProps) {
  const fitPoints: [number, number][] = items.map((i) => [i.stop.location.lat, i.stop.location.lng]);

  return (
    <BaseMap onMapClick={onMapClick} fitPoints={fitPoints} className={className}>
      {items.map((item, index) => (
        <Marker
          key={`${item.role}-${item.stop.id}`}
          position={[item.stop.location.lat, item.stop.location.lng]}
          icon={stopIcon(item.role, item.role === 'stop' ? index : index + 1)}
        >
          <Popup>
            <div className="min-w-[140px] text-[12px]">
              <p className="font-semibold text-ink">{item.stop.name}</p>
              <p className="text-ink-faint">
                {item.stop.location.lat.toFixed(4)}, {item.stop.location.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {route && route.length > 1 && (
        <Polyline
          positions={route.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: '#4f8cff',
            weight: 4,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
    </BaseMap>
  );
}