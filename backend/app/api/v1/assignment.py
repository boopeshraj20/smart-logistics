"""Vehicle assignment planning endpoint (prepares AI assignment contract)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.routing import AssignPlanRequest, AssignPlanResult
from app.services.assignment import plan_assignment
from app.services.ors import OrsError

router = APIRouter(tags=["assignment"])


@router.post("/assign/plan", response_model=AssignPlanResult)
async def assign_plan(req: AssignPlanRequest) -> AssignPlanResult:
    try:
        route, ranked = await plan_assignment(req)
    except OrsError as exc:
        raise HTTPException(status_code=502, detail=f"Routing service unreachable: {exc}") from exc
    return AssignPlanResult(
        route=route,
        recommended=ranked[0] if ranked else None,
        ranked=ranked,
    )