import { get, post } from '@/lib/api';

import { rankVehiclesForLoad } from './assignment';

import type {
  AssignPlanResult,
  AssignmentScore,
  GeoPoint,
  GeoSearchResult,
  RouteLeg,
  RouteResult,
  Stop,
  Vehicle,
  VehicleType,
} from '@/types';

export interface WaypointPayload {
  name: string;
  location: GeoPoint;
}

export interface OptimizePayload {
  start: WaypointPayload;
  stops: WaypointPayload[];
  destination: WaypointPayload;
  profile: 'driving-hgv' | 'driving-car';
  reorderStops: boolean;
  weightKg: number;
  vehicleCostPerKm?: number;
  mileageKmpl?: number;
  capacityKg?: number;
}

function toWaypoint(stop: { name: string; location: GeoPoint }): WaypointPayload {
  return { name: stop.name, location: stop.location };
}

export function searchPlaces(text: string, country = 'IN'): Promise<GeoSearchResult[]> {
  return get<GeoSearchResult[]>('/v1/geo/search', { text, country });
}

export function reverseGeocode(lat: number, lng: number): Promise<string> {
  return get<{ label: string }>('/v1/geo/reverse', { lat, lng }).then((d) => d.label);
}

export async function optimizeRoute(payload: OptimizePayload): Promise<RouteResult> {
  const data = await post<RouteResult>('/v1/routes/optimize', {
    start: toWaypoint(payload.start),
    stops: payload.stops.map(toWaypoint),
    destination: toWaypoint(payload.destination),
    profile: payload.profile,
    weight_kg: payload.weightKg,
    reorder_stops: payload.reorderStops,
    vehicle: {
      operating_cost_per_km: payload.vehicleCostPerKm ?? 48,
      mileage_kmpl: payload.mileageKmpl ?? 4.2,
      capacity_kg: payload.capacityKg ?? 16000,
    },
  });
  return { ...data, steps: [], provider: 'ors' };
}

export async function planAssignment(
  start: Stop,
  stops: Stop[],
  destination: Stop,
  weightKg: number,
  profile: 'driving-hgv' | 'driving-car',
  vehicles: Vehicle[],
): Promise<AssignPlanResult> {
  return post<AssignPlanResult>('/v1/assign/plan', {
    start: toWaypoint(start),
    stops: stops.map(toWaypoint),
    destination: toWaypoint(destination),
    weight_kg: weightKg,
    profile,
    vehicles: vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      plate_number: v.plateNumber,
      vehicle_type: v.type,
      capacity_kg: v.capacityKg,
      operating_cost_per_km: v.operatingCostPerKm,
      mileage_kmpl: v.mileageKmpl,
      fuel_type: v.fuelType,
      health_score: v.healthScore,
      available: v.available,
    })),
  });
}

export function profileForType(type: VehicleType): 'driving-hgv' | 'driving-car' {
  return type === 'heavy-truck' || type === 'mini-truck' ? 'driving-hgv' : 'driving-car';
}

export type { AssignmentScore };

const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const { sin, cos, asin, sqrt } = Math;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    sin(dLat / 2) ** 2 + cos(toRad(a.lat)) * cos(toRad(b.lat)) * sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * asin(sqrt(h));
}

export function straightLineGeometry(a: GeoPoint, b: GeoPoint, steps = 24): GeoPoint[] {
  const out: GeoPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    out.push({
      lat: a.lat + ((b.lat - a.lat) * i) / steps,
      lng: a.lng + ((b.lng - a.lng) * i) / steps,
    });
  }
  return out;
}

/**
 * Client-only planner used when the backend (or its ORS key) is unreachable.
 * Straight-line geometry + haversine distance + fleet scoring, so route
 * optimization always produces an answer even fully offline.
 */
export function buildOfflineAssignment(
  start: Stop,
  stops: Stop[],
  destination: Stop,
  weightKg: number,
  profile: 'driving-hgv' | 'driving-car',
  vehicles: Vehicle[],
): AssignPlanResult {
  const ordered = [start, ...stops, destination];
  const avgSpeed = profile === 'driving-hgv' ? 48 : 40;
  const costPerKm = profile === 'driving-hgv' ? 48 : 20;
  const mileageKmpl = profile === 'driving-hgv' ? 4.2 : 12;

  const legs: RouteLeg[] = [];
  const geometry: GeoPoint[] = [];
  let distanceKm = 0;
  let durationMin = 0;

  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const dist = haversineKm(a.location, b.location);
    const durMin = (dist / avgSpeed) * 60;
    const seg = straightLineGeometry(a.location, b.location);
    distanceKm += dist;
    durationMin += durMin;
    legs.push({ fromName: a.name, toName: b.name, distanceKm: dist, durationMin: durMin });
    if (geometry.length > 0) geometry.push(...seg.slice(1));
    else geometry.push(...seg);
  }

  const fuel = distanceKm / mileageKmpl;
  const route: RouteResult = {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: Math.round(durationMin),
    geometry,
    steps: [],
    fuelEstimateL: Math.round(fuel),
    costEstimate: Math.round(distanceKm * costPerKm),
    co2EstimateKg: Math.round(fuel * 2.68),
    provider: 'local',
    profile,
    congestionPct: 0,
    legs,
    orderedWaypoints: ordered,
  };

  const ranked = rankVehiclesForLoad({ vehicles, weightKg, distanceKm });
  return { route, recommended: ranked[0] ?? null, ranked };
}

export interface ResilientPlan extends AssignPlanResult {
  /** True when the backend (or its ORS dependency) could not be reached. */
  offline: boolean;
  /** The real, surfaceable reason for the fallback, when known. */
  offlineReason?: string;
}

export async function planAssignmentResilient(
  start: Stop,
  stops: Stop[],
  destination: Stop,
  weightKg: number,
  profile: 'driving-hgv' | 'driving-car',
  vehicles: Vehicle[],
): Promise<ResilientPlan> {
  try {
    const plan = await planAssignment(start, stops, destination, weightKg, profile, vehicles);
    return { ...plan, offline: false };
  } catch (err) {
    const reason =
      (err instanceof Error ? err.message : String(err)) || 'Backend request failed';
    console.error('[routing] Backend assignment failed — real reason:', reason, err);
    const plan = buildOfflineAssignment(start, stops, destination, weightKg, profile, vehicles);
    return { ...plan, offline: true, offlineReason: reason };
  }
}