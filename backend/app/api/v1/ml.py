"""Phase 6 AI intelligence layer - FastAPI routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.ml import models as ml
from app.schemas.ml import (
    AiAssignRequest,
    AiAssignResult,
    AiExplanation,
    AiRankedVehicle,
    DemandForecastResult,
    EcoAssessRequest,
    EcoAssessResponse,
    EcoRank,
    FactorContribution,
    MaintenanceReport,
    MaintenanceResponse,
    MaintenanceVehicle,
    ModelInfo,
    TrainResult,
)
from app.schemas.routing import OptimizeRequest
from app.services.routing import compute_optimized_route

router = APIRouter(tags=["ai"])


def _meta_as_info(meta: dict) -> ModelInfo:
    return ModelInfo(
        model_id=meta["model_id"],
        model_name=meta["model_name"],
        family=meta["family"],
        trained_at=meta["trained_at"],
        dataset=meta.get("dataset", ""),
        features=meta.get("features", []),
        metrics=meta.get("metrics", {}),
        confidence=float(meta.get("confidence", 0.9)),
    )


def _explain(data: dict) -> AiExplanation:
    if not data:
        return AiExplanation(summary="", confidence=0.9)
    factors = [FactorContribution(**f) for f in data.get("factors", [])]
    return AiExplanation(
        summary=data.get("summary", ""),
        bullets=data.get("bullets", []),
        confidence=float(data.get("confidence", 0.9)),
        factors=factors,
    )


@router.get("/models", response_model=list[ModelInfo])
async def list_models() -> list[ModelInfo]:
    """Registry of trained models with evaluation metrics (lazy-loads on first call)."""
    return [_meta_as_info(m) for m in ml.list_models()]


@router.post("/train", response_model=TrainResult)
async def train() -> TrainResult:
    """Retrain every model from the source datasets."""
    result = ml.train_all()
    return TrainResult(
        trained_at=result["trained_at"],
        status=result["status"],
        datasets=result["datasets"],
        models=[_meta_as_info(m) for m in result["models"]],
    )


@router.get("/forecast/demand", response_model=DemandForecastResult)
async def forecast_demand(days: int = Query(default=14, ge=3, le=45)) -> DemandForecastResult:
    """Predict shipment demand for the next ``days`` days, with a fleet-sizing recommendation."""
    from app.ml.models import forecast_demand as _forecast

    data = _forecast(days=days)
    return DemandForecastResult(
        horizon_days=data["horizon_days"],
        points=data["points"],
        recommended_fleet_size=data["recommended_fleet_size"],
        recommendation=data["recommendation"],
        peak_days=data["peak_days"],
        explanation=_explain(data["explanation"]),
        model=_meta_as_info(data["model"]),
    )


@router.post("/maintenance/predict", response_model=MaintenanceResponse)
async def maintenance_predict(vehicles: list[MaintenanceVehicle]) -> MaintenanceResponse:
    """Predict health, next-service and failure risk for each supplied vehicle."""
    reports = ml.predict_maintenance([v.model_dump() for v in vehicles])
    meta = _meta_for("health")
    return MaintenanceResponse(
        evaluated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        reports=[MaintenanceReport(**r) for r in reports],
        model=_meta_as_info(meta),
    )


@router.post("/assign/recommend", response_model=AiAssignResult)
async def assign_recommend(req: AiAssignRequest) -> AiAssignResult:
    """ML-ranked vehicle assignment with explanations (learned cost-first policy)."""
    if not req.vehicles:
        raise HTTPException(status_code=422, detail="Provide at least one candidate vehicle.")
    try:
        route = await compute_optimized_route(
            OptimizeRequest(
                start=req.start,
                stops=req.stops,
                destination=req.destination,
                profile=req.profile,
                weight_kg=req.weight_kg,
                reorder_stops=True,
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    ranked = ml.recommend_assignment(
        [v.model_dump() for v in req.vehicles],
        distance_km=route.distance_km,
        weight_kg=req.weight_kg,
    )
    ranked_models = [AiRankedVehicle(**r) for r in ranked]
    best = ranked_models[0] if ranked_models else None

    reason = (
        f"Best match: {best.vehicle_name} (score {best.score:.2f}) because {'; '.join(best.reasons)}."
        if best
        else "No feasible vehicle."
    )
    return AiAssignResult(
        route_ok=True,
        distance_km=route.distance_km,
        recommended=best,
        ranked=ranked_models,
        explanation=AiExplanation(
            summary=reason,
            bullets=best.explanation.bullets if best else [],
            confidence=best.explanation.confidence if best else 0.9,
            factors=best.explanation.factors if best else [],
        ),
        model=_meta_as_info(_meta_for("assignment")),
    )


@router.post("/eco/assess", response_model=EcoAssessResponse)
async def eco_assess(req: EcoAssessRequest) -> EcoAssessResponse:
    """Fuel, CO2 and sustainability scoring for a trip across candidate vehicles."""
    if not req.vehicles:
        raise HTTPException(status_code=422, detail="Provide at least one candidate vehicle.")
    data = ml.assess_eco(
        [v.model_dump() for v in req.vehicles],
        distance_km=req.distance_km,
        weight_kg=req.weight_kg,
    )
    return EcoAssessResponse(
        fleet_fuel_l=data["fleet_fuel_l"],
        fleet_co2_kg=data["fleet_co2_kg"],
        distance_km=data["distance_km"],
        sustainability_score=data["sustainability_score"],
        eco_savings_kg=data["eco_savings_kg"],
        breakdown=data["breakdown"],
        ranking=[EcoRank(**r) for r in data["ranking"]],
        recommendation=data["recommendation"],
        explanation=_explain(data["explanation"]),
        model=_meta_as_info(data["model"]),
    )


def _meta_for(model_id: str) -> dict:
    for info in ml.list_models():
        if info["model_id"] == model_id:
            return info
    return {
        "model_id": model_id,
        "model_name": model_id,
        "family": "unknown",
        "trained_at": "",
        "confidence": 0.9,
    }