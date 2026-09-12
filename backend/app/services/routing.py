"""Business logic for real-road route optimization."""

from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.schemas.routing import (
    GeoPoint,
    OptimizeRequest,
    OptimizeResult,
    RouteLeg,
    VehicleParams,
    Waypoint,
)
from app.services.ors import ors

logger = logging.getLogger("lumina.routing")

KM_PER_RADIAN = 6371.0088


def _haversine_km(a: GeoPoint, b: GeoPoint) -> float:
    """Geodesic distance used only for micro-ordering heuristics.

    Displayed distances always come from the real road network via ORS.
    """
    lat1, lon1, lat2, lon2 = map(math.radians, (a.lat, a.lng, b.lat, b.lng))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * KM_PER_RADIAN * math.asin(math.sqrt(h))


def congestion_factor(now: datetime | None = None) -> tuple[float, float]:
    """Simple rush-hour congestion model (ORS free tier has no live traffic).

    Returns (multiplier, percent). Peak weekday morning/evening amplifies ETA;
    late night is near free-flow.
    """
    dt = now or datetime.now(timezone.utc)
    ist = dt.astimezone(timezone(timedelta(hours=5, minutes=30)))
    hour = ist.hour
    if ist.weekday() >= 5:  # weekends
        factor = 1.05
    elif 8 <= hour <= 10 or 17 <= hour <= 20:
        factor = 1.35
    elif (7 <= hour < 8) or (20 <= hour < 22) or (11 <= hour <= 13):
        factor = 1.18
    else:
        factor = 1.05 if 22 <= hour or hour < 6 else 1.12
    return factor, round((factor - 1.0) * 100, 1)


def reorder_stops(start: Waypoint, stops: list[Waypoint]) -> list[Waypoint]:
    """Nearest-neighbour ordering of intermediate stops (heuristic).

    The real-road distance/time of the final polyline is unchanged by ORS;
    this only picks a sensible visit order when the user enables it.
    """
    if len(stops) <= 1:
        return stops
    remaining = [s for s in stops]
    ordered: list[Waypoint] = []
    cursor = start.location
    while remaining:
        nxt = min(remaining, key=lambda s: _haversine_km(cursor, s.location))
        ordered.append(nxt)
        remaining.remove(nxt)
        cursor = nxt.location
    return ordered


def _coords(waypoints: list[Waypoint]) -> list[tuple[float, float]]:
    return [(w.location.lng, w.location.lat) for w in waypoints]


async def _pair_route(profile: str, a: GeoPoint, b: GeoPoint):
    try:
        data = await ors.directions(profile, [(a.lng, a.lat), (b.lng, b.lat)])
    except Exception as exc:
        logger.warning(
            "ORS failed for leg [%s] -> [%s] (profile=%s): %s",
            (a.lat, a.lng),
            (b.lat, b.lng),
            profile,
            exc,
        )
        raise
    feature = data["features"][0]
    props = feature["properties"]
    summary = props["summary"]
    geometry: list[list[float]] = feature["geometry"]["coordinates"]
    logger.info(
        "ORS leg [%s] -> [%s]: distance_km=%.1f duration_s=%.1f points=%d",
        (a.lat, a.lng),
        (b.lat, b.lng),
        summary["distance"],
        summary["duration"],
        len(geometry),
    )
    return summary["distance"], summary["duration"], geometry





def _estimate(vehicle: VehicleParams, distance_km: float, weight_kg: float) -> dict[str, float]:
    """Fuel, operating cost and CO2 estimates from road distance."""
    mileage = max(vehicle.mileage_kmpl, 0.1)
    fuel = distance_km / mileage
    cost = distance_km * vehicle.operating_cost_per_km
    co2 = fuel * settings.co2_per_litre_fuel
    return {"fuel": fuel, "cost": cost, "co2": co2}


async def compute_optimized_route(req: OptimizeRequest) -> OptimizeResult:
    """Call ORS per-leg on the real road network and merge into one result."""
    vehicle = req.vehicle or VehicleParams()
    ordered = list([req.start] + (reorder_stops(req.start, list(req.stops)) if req.reorder_stops else list(req.stops)) + [req.destination])
    if len(ordered) < 2:
        raise ValueError("A route needs a start and a destination.")

    factor, pct = congestion_factor()
    total_km = 0.0
    total_dur = 0.0
    merged: list[GeoPoint] = []
    legs: list[RouteLeg] = []

    pairs = list(zip(ordered, ordered[1:]))
    for i, (a, b) in enumerate(pairs):
        if _haversine_km(a.location, b.location) < 0.01:
            continue
        # Real ORS call. NO silent fallback: any ORS failure must surface
        # so the frontend can tell the user exactly what went wrong instead
        # of lying with a straight-line "estimate".
        dist, dur, geometry = await _pair_route(req.profile, a.location, b.location)
        total_km += dist
        total_dur += dur * factor
        legs.append(RouteLeg(from_name=a.name or f"Stop {i + 1}", to_name=b.name or f"Stop {i + 2}", distance_km=dist, duration_min=dur * factor / 60.0))
        if merged and geometry:
            merged.extend(GeoPoint(lat=pt[1], lng=pt[0]) for pt in geometry[1:])
        else:
            merged.extend(GeoPoint(lat=pt[1], lng=pt[0]) for pt in geometry)

    estimates = _estimate(vehicle, total_km, req.weight_kg)

    return OptimizeResult(
        profile=req.profile,
        distance_km=round(total_km, 2),
        duration_min=round(total_dur / 60.0, 1),
        congestion_pct=pct,
        fuel_estimate_l=round(estimates["fuel"], 1),
        cost_estimate=round(estimates["cost"], 0),
        co2_estimate_kg=round(estimates["co2"], 0),
        geometry=merged,
        legs=legs,
        ordered_waypoints=ordered,
    )