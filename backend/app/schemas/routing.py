"""Pydantic schemas for routing, geocoding and vehicle assignment."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RouteProfile = Literal["driving-car", "driving-hgv", "cycling-regular"]


class GeoPoint(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class Waypoint(BaseModel):
    name: str = ""
    location: GeoPoint


class VehicleParams(BaseModel):
    """Vehicle economics used for cost estimation (optional overrides)."""

    operating_cost_per_km: float = 48.0
    mileage_kmpl: float = 4.2
    capacity_kg: float = 16000.0
    health_score: int = 100
    fuel_type: str = "diesel"


class OptimizeRequest(BaseModel):
    start: Waypoint
    stops: list[Waypoint] = Field(default_factory=list)
    destination: Waypoint
    profile: RouteProfile = "driving-hgv"
    vehicle: VehicleParams | None = None
    weight_kg: float = 0.0
    reorder_stops: bool = True


class RouteLeg(BaseModel):
    from_name: str
    to_name: str
    distance_km: float
    duration_min: float


class GeoSearchResult(BaseModel):
    name: str
    label: str
    region: str
    country: str
    longitude: float
    latitude: float


class OptimizeResult(BaseModel):
    provider: Literal["ors"] = "ors"
    profile: RouteProfile
    distance_km: float
    duration_min: float
    congestion_pct: float
    fuel_estimate_l: float
    cost_estimate: float
    co2_estimate_kg: float
    geometry: list[GeoPoint]
    legs: list[RouteLeg]
    ordered_waypoints: list[Waypoint]


class VehicleCandidate(BaseModel):
    id: str
    name: str
    plate_number: str = ""
    vehicle_type: str = "heavy-truck"
    capacity_kg: float
    operating_cost_per_km: float
    mileage_kmpl: float
    fuel_type: str = "diesel"
    health_score: int = 100
    available: bool = True


class AssignPlanRequest(BaseModel):
    start: Waypoint
    stops: list[Waypoint] = Field(default_factory=list)
    destination: Waypoint
    weight_kg: float = 0.0
    profile: RouteProfile = "driving-hgv"
    vehicles: list[VehicleCandidate] = Field(default_factory=list)


class AssignmentScore(BaseModel):
    vehicle_id: str
    vehicle_name: str
    plate_number: str
    vehicle_type: str
    availability: bool
    capacity_ok: bool
    score: float
    cost_estimate: float
    co2_estimate_kg: float
    eta_min: float
    reasons: list[str]


class AssignPlanResult(BaseModel):
    route: OptimizeResult
    recommended: AssignmentScore | None
    ranked: list[AssignmentScore]