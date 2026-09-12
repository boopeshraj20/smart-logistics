"""Pydantic schemas for the Phase 6 AI intelligence layer."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.routing import RouteProfile, VehicleCandidate, Waypoint


class FactorContribution(BaseModel):
    """One input feature and its signed contribution to the prediction."""

    feature: str
    value: float
    contribution: float
    direction: Literal["positive", "negative", "neutral"]
    note: str


class AiExplanation(BaseModel):
    """Every prediction carries confidence + human-readable reasoning."""

    summary: str
    bullets: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
    factors: list[FactorContribution] = Field(default_factory=list)


class ModelInfo(BaseModel):
    """Trained model metadata + evaluation metrics."""

    model_id: str
    model_name: str
    family: str
    trained_at: str
    dataset: str
    features: list[str] = Field(default_factory=list)
    metrics: dict[str, float] = Field(default_factory=dict)
    confidence: float = Field(default=0.9, ge=0, le=1)


class TrainResult(BaseModel):
    trained_at: str
    status: str
    datasets: dict[str, int]
    models: list[ModelInfo]


# --- Demand forecast -------------------------------------------------------

class DemandForecastPoint(BaseModel):
    date: str
    actual: float | None = None
    predicted: float
    lower: float | None = None
    upper: float | None = None


class DemandForecastResult(BaseModel):
    horizon_days: int
    points: list[DemandForecastPoint]
    recommended_fleet_size: int
    recommendation: str
    peak_days: list[str]
    explanation: AiExplanation
    model: ModelInfo


# --- Predictive maintenance ------------------------------------------------

class MaintenanceVehicle(BaseModel):
    id: str
    name: str
    plate_number: str = ""
    vehicle_type: str = "heavy-truck"
    odometer_km: float
    km_since_service: float
    service_interval_km: float
    age_months: float = 24.0
    avg_daily_km: float = 120.0


class MaintenanceReport(BaseModel):
    vehicle_id: str
    vehicle_name: str
    plate_number: str
    vehicle_type: str
    health_score: float
    status_label: Literal["excellent", "good", "fair", "poor", "critical"]
    next_maintenance_km: float
    remaining_km_to_service: float
    predicted_failure_risk: float
    recommendations: list[str]
    explanation: AiExplanation


class MaintenanceResponse(BaseModel):
    evaluated_at: str
    reports: list[MaintenanceReport]
    model: ModelInfo


# --- AI vehicle assignment -------------------------------------------------

class AiRankedVehicle(BaseModel):
    """ML ranking of one candidate - augments the heuristic contract."""

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
    fuel_l: float = 0.0
    reasons: list[str]
    explanation: AiExplanation


class AiAssignRequest(BaseModel):
    start: Waypoint
    stops: list[Waypoint] = Field(default_factory=list)
    destination: Waypoint
    weight_kg: float = 0.0
    profile: RouteProfile = "driving-hgv"
    vehicles: list[VehicleCandidate] = Field(default_factory=list)


class AiAssignResult(BaseModel):
    route_ok: bool = True
    distance_km: float = 0.0
    recommended: AiRankedVehicle | None = None
    ranked: list[AiRankedVehicle]
    explanation: AiExplanation
    model: ModelInfo


# --- Green logistics -------------------------------------------------------

class EcoAssessRequest(BaseModel):
    distance_km: float = Field(gt=0)
    weight_kg: float = 0.0
    profile: RouteProfile = "driving-hgv"
    vehicles: list[VehicleCandidate] = Field(default_factory=list)


class EcoRank(BaseModel):
    vehicle_id: str
    vehicle_name: str
    plate_number: str
    vehicle_type: str
    fuel_l: float
    co2_kg: float
    cost: float
    sustainability_score: float
    reasons: list[str]
    explanation: AiExplanation


class EcoAssessResponse(BaseModel):
    fleet_fuel_l: float
    fleet_co2_kg: float
    distance_km: float
    sustainability_score: float
    eco_savings_kg: float
    breakdown: dict[str, float]
    ranking: list[EcoRank]
    recommendation: str
    explanation: AiExplanation
    model: ModelInfo