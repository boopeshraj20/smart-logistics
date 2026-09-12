"""Heuristic vehicle-assignment scoring.

Full AI assignment (ML-driven) lands in Phase 7; this deterministic scorer
already prepares the JSON contract and decision reasons used by the UI.
"""

from __future__ import annotations

from app.schemas.routing import (
    AssignPlanRequest,
    AssignmentScore,
    OptimizeResult,
    VehicleCandidate,
    VehicleParams,
)
from app.services.routing import compute_optimized_route, congestion_factor


def _vehicle_cost_estimate(vehicle: VehicleCandidate, distance_km: float) -> float:
    return distance_km * vehicle.operating_cost_per_km


def _vehicle_co2(vehicle: VehicleCandidate, distance_km: float) -> float:
    from app.core.config import settings

    mileage = max(vehicle.mileage_kmpl, 0.1)
    return (distance_km / mileage) * settings.co2_per_litre_fuel


async def plan_assignment(req: AssignPlanRequest) -> tuple[OptimizeResult, list[AssignmentScore]]:
    """Score candidate vehicles against a route and return a ranked list."""
    route = await compute_optimized_route(
        OptimizeRequest(
            start=req.start,
            stops=req.stops,
            destination=req.destination,
            profile=req.profile,
            vehicle=VehicleParams(),
            weight_kg=req.weight_kg,
        )
    )

    dist = route.distance_km
    factor, _ = congestion_factor()
    eta = route.duration_min

    scored: list[AssignmentScore] = []

    for v in req.vehicles:
        capacity_ok = v.capacity_kg >= req.weight_kg or req.weight_kg <= 0
        cost = _vehicle_cost_estimate(v, dist)
        co2 = _vehicle_co2(v, dist)

        reasons: list[str] = []
        if not v.available:
            reasons.append("Vehicle is not currently available")
        if not capacity_ok:
            reasons.append(f"Capacity {v.capacity_kg} kg below shipment weight {int(req.weight_kg)} kg")

        # Normalised sub-scores (0..1, higher is better).
        # Cost dominates, then ETA, then fleet health, then availability.
        max_cost = max((x.operating_cost_per_km for x in req.vehicles), default=1)
        min_cost = min((x.operating_cost_per_km for x in req.vehicles), default=1)
        cost_range = max(max_cost - min_cost, 1e-6)
        cost_score = 1 - ((v.operating_cost_per_km - min_cost) / cost_range)

        eta_score = max(0.0, 1 - (eta / (eta + 60)))
        health_score = v.health_score / 100.0
        avail_score = 1.0 if v.available else 0.0

        score = 0.5 * cost_score + 0.25 * eta_score + 0.15 * health_score + 0.1 * avail_score
        if not capacity_ok or not v.available:
            score *= 0.1

        if capacity_ok:
            reasons.append("Capacity matches shipment load")
        if v.available:
            reasons.append("Vehicle available now")

        scored.append(
            AssignmentScore(
                vehicle_id=v.id,
                vehicle_name=v.name,
                plate_number=v.plate_number,
                vehicle_type=v.vehicle_type,
                availability=v.available,
                capacity_ok=capacity_ok,
                score=round(score, 3),
                cost_estimate=round(cost, 0),
                co2_estimate_kg=round(co2, 0),
                eta_min=round(eta, 1),
                reasons=reasons[:3],
            )
        )

    scored.sort(key=lambda s: s.score, reverse=True)
    return route, scored