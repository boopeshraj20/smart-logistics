import { useEffect, type ReactNode } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { config } from '@/services/config';

const cartoKey = config.cartoApiKey;

const TILE_URL = cartoKey
  ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ATTRIBUTION = cartoKey
  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface MapClick {
  lat: number;
  lng: number;
}

interface MapEventsProps {
  onMapClick?: (click: MapClick) => void;
}

function MapEvents({ onMapClick }: MapEventsProps) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface FitBoundsProps {
  points: [number, number][];
}

function FitBounds({ points }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const valid = points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView(valid[0], Math.max(map.getZoom(), 8));
      return;
    }
    map.fitBounds(valid, { padding: [48, 48], maxZoom: 11 });
  }, [map, points]);
  return null;
}

interface BaseMapProps {
  children?: ReactNode;
  onMapClick?: (click: MapClick) => void;
  fitPoints?: [number, number][];
  className?: string;
}

export default function BaseMap({ children, onMapClick, fitPoints = [], className }: BaseMapProps) {
  return (
    <div className={className ?? 'h-56 w-full'}>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        zoomControl={false}
        attributionControl={true}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          url={TILE_URL}
          attribution={ATTRIBUTION}
          subdomains={cartoKey ? 'abcd' : 'abc'}
          maxZoom={19}
          className={!cartoKey ? 'leaflet-tile-dark' : undefined}
        />
        {onMapClick && <MapEvents onMapClick={onMapClick} />}
        <FitBounds points={fitPoints} />
        {children}
      </MapContainer>
    </div>
  );
}

export type { MapClick as MapClickEvent };