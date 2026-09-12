"""API routing tree."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import assignment, health, ml, routing

api_router = APIRouter()
api_router.include_router(health.router, prefix="/system")
api_router.include_router(routing.router)
api_router.include_router(assignment.router)
api_router.include_router(ml.router)


@api_router.get("/meta")
async def meta() -> dict[str, object]:
    return {
        "name": "Lumina Logistics API",
        "version": "0.2.0",
        "modules": ["fleet", "shipments", "routing", "ai",
                    "maintenance", "sustainability", "forecasting"],
    }