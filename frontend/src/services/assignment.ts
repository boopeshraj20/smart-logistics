import type { AssignmentScore, Vehicle, VehicleType } from '@/types';

/** Rough per-class cruising speed (km/h) used for ETA estimates. */
const CLASS_AVG_SPEED: Record<VehicleType, number> = {
  'heavy-truck': 45,
  'mini-truck': 40,
  tempo: 35,
  'delivery-van': 32,
};

/** CO₂ per litre of fuel burned (kg) — diesel-centric approximation. */
const CO2_PER_LITRE = 2.68;

export interface RankVehiclesInput {
  vehicles: Vehicle[];
  /** Shipment cargo weight in kg (0 = capacity-agnostic). */
  weightKg: number;
  /** Expected route distance in km. */
  distanceKm: number;
}

/**
 * Phase 5 — Adaptive Vehicle Assignment (client-side scorer).
 *
 * Scores every vehicle in the *user's own fleet* against a shipment load.
 * The score function is deliberately transparent: cost-efficiency dominates,
 * then fuel economy, fleet health, availability and capacity fit — and every
 * decision carries a human-readable reason, so the recommendation explains
 * itself (e.g. "Mini Truck selected because: Capacity matches requirement,
 * Lower fuel cost, Lowest estimated delivery cost").
 */
export function rankVehiclesForLoad({ vehicles, weightKg, distanceKm }: RankVehiclesInput): AssignmentScore[] {
  if (vehicles.length === 0) return [];
  const dist = Math.max(distanceKm, 0);
  const weight = Math.max(weightKg, 0);

  const maxCost = Math.max(...vehicles.map((v) => v.operatingCostPerKm));
  const minCost = Math.min(...vehicles.map((v) => v.operatingCostPerKm));
  const costRange = Math.max(maxCost - minCost, 1e-6);
  const maxMileage = Math.max(...vehicles.map((v) => Math.max(v.mileageKmpl, 0.1)));

  const scored = vehicles.map((v) => {
    const capacityOkay = weight === 0 || v.capacityKg >= weight;
    const etaMin = dist / CLASS_AVG_SPEED[v.type] * 60;

    const reasons: string[] = [];
    if (!v.available) reasons.push('Vehicle is not currently available');
    if (!capacityOkay) {
      reasons.push(
        `Capacity ${v.capacityKg.toLocaleString()} kg below shipment weight ${weight.toLocaleString()} kg`,
      );
    }
    if (capacityOkay) reasons.push('Capacity matches requirement');
    if (v.available) reasons.push('Vehicle available now');

    // Normalised sub-scores (0..1, higher is better).
    const costScore = 1 - (v.operatingCostPerKm - minCost) / costRange;
    const efficiencyScore = Math.max(v.mileageKmpl, 0.1) / maxMileage;
    const healthScore = v.healthScore / 100;
    const availabilityScore = v.available ? 1 : 0;
    const capacityFit = capacityOkay ? 1 : 0;

    let score =
      0.4 * costScore +
      0.2 * efficiencyScore +
      0.15 * healthScore +
      0.15 * availabilityScore +
      0.1 * capacityFit;

    if (!capacityOkay || !v.available) score *= 0.1;

    // Why-rationale, cost-driven phrasing used by the advisor copy.
    if (v.operatingCostPerKm === minCost) reasons.push('Lowest operating cost per km');
    else if (v.operatingCostPerKm <= maxCost * 0.55) reasons.push('Lower fuel cost');
    if (v.mileageKmpl === maxMileage) reasons.push('Best fuel efficiency in fleet');

    const remaining = Math.max(
      0,
      v.maintenanceIntervalKm - (v.currentOdometerKm - v.lastMaintenanceKm),
    );
    if (remaining <= 500) {
      reasons.push(`Service due within ${remaining.toLocaleString()} km — schedule maintenance`);
    }

    return {
      vehicleId: v.id,
      vehicleName: v.name,
      plateNumber: v.plateNumber,
      vehicleType: v.type,
      availability: v.available,
      capacityOk: capacityOkay,
      score: Math.round(score * 1000) / 1000,
      costEstimate: Math.round(dist * v.operatingCostPerKm),
      co2EstimateKg: Math.round((dist / Math.max(v.mileageKmpl, 0.1)) * CO2_PER_LITRE),
      etaMin: Math.round(etaMin),
      reasons: reasons.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}