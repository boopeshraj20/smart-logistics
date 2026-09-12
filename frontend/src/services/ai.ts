/**
 * Phase 6 — AI Intelligence Layer client.
 *
 * Typed wrappers over the ML endpoints. Every call degrades gracefully:
 * network / backend failures resolve to `null` so UI components can fall
 * back to deterministic client-side estimates instead of throwing.
 */

import { config } from './config';
import type { Vehicle } from '@/types';

/* ------------------------------ Wire types ------------------------------ */

export interface AiFactor {
  feature: string;
  value: number;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
  note: string;
}

export interface AiExplanation {
  summary: string;
  bullets: string[];
  confidence: number;
  factors: AiFactor[];
}

export interface AiModelInfo {
  model_id: string;
  model_name: string;
  family: string;
  trained_at: string;
  dataset: string;
  features: string[];
  metrics: Record<string, number>;
  confidence: number;
}

export interface AiTrendPoint {
  date: string;
  actual: number | null;
  predicted: number;
  lower: number | null;
  upper: number | null;
}

export interface AiForecastResult {
  horizonDays: number;
  points: AiTrendPoint[];
  recommendedFleetSize: number;
  recommendation: string;
  peakDays: string[];
  explanation: AiExplanation;
  model: AiModelInfo;
}

export interface AiHealthReport {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  vehicleType: string;
  healthScore: number;
  statusLabel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  nextMaintenanceKm: number;
  remainingKmToService: number;
  predictedFailureRisk: number;
  recommendations: string[];
  explanation: AiExplanation;
}

export interface AiEcoRank {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  vehicleType: string;
  fuelL: number;
  co2Kg: number;
  cost: number;
  sustainabilityScore: number;
  reasons: string[];
}

export interface AiEcoResult {
  fleetFuelL: number;
  fleetCo2Kg: number;
  distanceKm: number;
  sustainabilityScore: number;
  ecoSavingsKg: number;
  breakdown: Record<string, number>;
  ranking: AiEcoRank[];
  recommendation: string;
  explanation: AiExplanation;
}

/* ------------------------------ Transport ------------------------------- */

const REQUEST_TIMEOUT_MS = 12_000;

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`${config.apiBase}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.warn('[ai] request failed (will use client-side fallback):', err);
    return null;
  }
}

/* ------------------------- Fleet -> ML transports ----------------------- */

function toMlTransport(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    plate_number: vehicle.plateNumber,
    vehicle_type: vehicle.type,
    odometer_km: vehicle.currentOdometerKm,
    km_since_service: Math.max(0, vehicle.currentOdometerKm - vehicle.lastMaintenanceKm),
    service_interval_km: vehicle.maintenanceIntervalKm,
    age_months: 24,
    avg_daily_km: 120,
  };
}

function toMlCandidate(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    plate_number: vehicle.plateNumber,
    vehicle_type: vehicle.type,
    capacity_kg: vehicle.capacityKg,
    operating_cost_per_km: vehicle.operatingCostPerKm,
    mileage_kmpl: vehicle.mileageKmpl,
    fuel_type: vehicle.fuelType,
    health_score: vehicle.healthScore,
    available: vehicle.available,
  };
}

/* -------------------------------- APIs ---------------------------------- */

export async function listModels(): Promise<AiModelInfo[] | null> {
  return fetchJson<AiModelInfo[]>('/v1/models');
}

export async function retrainModels(): Promise<{ status: string; models: AiModelInfo[] } | null> {
  return fetchJson<{ status: string; models: AiModelInfo[] }>('/v1/train', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function forecastDemand(days = 14): Promise<AiForecastResult | null> {
  const raw = await fetchJson<{
    horizon_days: number;
    points: Array<{
      date: string;
      actual: number | null;
      predicted: number;
      lower: number | null;
      upper: number | null;
    }>;
    recommended_fleet_size: number;
    recommendation: string;
    peak_days: string[];
    explanation: AiExplanation;
    model: AiModelInfo;
  }>(`/v1/forecast/demand?days=${days}`);
  if (!raw) return null;
  return {
    horizonDays: raw.horizon_days,
    points: raw.points,
    recommendedFleetSize: raw.recommended_fleet_size,
    recommendation: raw.recommendation,
    peakDays: raw.peak_days,
    explanation: raw.explanation,
    model: raw.model,
  };
}

export async function predictMaintenance(vehicles: Vehicle[]): Promise<AiHealthReport[] | null> {
  if (vehicles.length === 0) return null;
  const raw = await fetchJson<{
    evaluated_at: string;
    reports: Array<{
      vehicle_id: string;
      vehicle_name: string;
      plate_number: string;
      vehicle_type: string;
      health_score: number;
      status_label: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      next_maintenance_km: number;
      remaining_km_to_service: number;
      predicted_failure_risk: number;
      recommendations: string[];
      explanation: AiExplanation;
    }>;
    model: AiModelInfo;
  }>('/v1/maintenance/predict', {
    method: 'POST',
    body: JSON.stringify(vehicles.map(toMlTransport)),
  });
  if (!raw) return null;
  return raw.reports.map((r) => ({
    vehicleId: r.vehicle_id,
    vehicleName: r.vehicle_name,
    plateNumber: r.plate_number,
    vehicleType: r.vehicle_type,
    healthScore: r.health_score,
    statusLabel: r.status_label,
    nextMaintenanceKm: r.next_maintenance_km,
    remainingKmToService: r.remaining_km_to_service,
    predictedFailureRisk: r.predicted_failure_risk,
    recommendations: r.recommendations,
    explanation: r.explanation,
  }));
}

export async function assessEco(input: {
  distanceKm: number;
  weightKg: number;
  profile?: string;
  vehicles: Vehicle[];
}): Promise<AiEcoResult | null> {
  if (input.vehicles.length === 0) return null;
  const raw = await fetchJson<{
    fleet_fuel_l: number;
    fleet_co2_kg: number;
    distance_km: number;
    sustainability_score: number;
    eco_savings_kg: number;
    breakdown: Record<string, number>;
    ranking: Array<{
      vehicle_id: string;
      vehicle_name: string;
      plate_number: string;
      vehicle_type: string;
      fuel_l: number;
      co2_kg: number;
      cost: number;
      sustainability_score: number;
      reasons: string[];
    }>;
    recommendation: string;
    explanation: AiExplanation;
  }>('/v1/eco/assess', {
    method: 'POST',
    body: JSON.stringify({
      distance_km: input.distanceKm,
      weight_kg: input.weightKg,
      profile: input.profile ?? 'driving-hgv',
      vehicles: input.vehicles.map(toMlCandidate),
    }),
  });
  if (!raw) return null;
  return {
    fleetFuelL: raw.fleet_fuel_l,
    fleetCo2Kg: raw.fleet_co2_kg,
    distanceKm: raw.distance_km,
    sustainabilityScore: raw.sustainability_score,
    ecoSavingsKg: raw.eco_savings_kg,
    breakdown: raw.breakdown,
    ranking: raw.ranking.map((r) => ({
      vehicleId: r.vehicle_id,
      vehicleName: r.vehicle_name,
      plateNumber: r.plate_number,
      vehicleType: r.vehicle_type,
      fuelL: r.fuel_l,
      co2Kg: r.co2_kg,
      cost: r.cost,
      sustainabilityScore: r.sustainability_score,
      reasons: r.reasons,
    })),
    recommendation: raw.recommendation,
    explanation: raw.explanation,
  };
}

/* --------------------------- Client-side fallback ----------------------- */

/** Deterministic proxy forecast used when the backend is unreachable. */
export function fallbackForecast(days = 14): AiForecastResult {
  const today = new Date();
  const random = mulberry32(1337);
  const points: AiTrendPoint[] = [];
  const peakDays: string[] = [];
  let peak = 0;
  for (let i = 1; i <= days; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const seasonal = 1 + 0.25 * Math.sin((i / days) * Math.PI * 2);
    const base = 40 + (i % 7 === 0 ? 6 : dow === 0 ? 2 : 0);
    const value = Math.max(0, Math.round(base * seasonal + (random() - 0.5) * 8));
    if (value > peak) {
      peak = value;
      peakDays.length = 0;
      peakDays.push(d.toISOString().slice(0, 10));
    } else if (value === peak) {
      peakDays.push(d.toISOString().slice(0, 10));
    }
    points.push({ date: d.toISOString().slice(0, 10), actual: null, predicted: value, lower: value - 9, upper: value + 9 });
  }
  return {
    horizonDays: days,
    points,
    recommendedFleetSize: Math.max(1, Math.ceil(peak / 10)),
    recommendation: `Estimate: the busiest forecast day needs ≈${Math.max(1, Math.ceil(peak / 10))} vehicles dispatched.`,
    peakDays: peakDays.slice(0, 3),
    explanation: {
      summary: 'Backend offline — projection from a deterministic seasonal-lift model.',
      bullets: ['Weekly peak lift applied on the busiest weekday.', 'Confidence band reflects a ±9 shipment spread.'],
      confidence: 0.5,
      factors: [],
    },
    model: {
      model_id: 'demand-local',
      model_name: 'Local proxy',
      family: 'Deterministic',
      trained_at: new Date().toISOString(),
      dataset: 'none',
      features: [],
      metrics: {},
      confidence: 0.5,
    },
  };
}

/** Deterministic squashed-[0,1] PRNG so fallbacks are stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}