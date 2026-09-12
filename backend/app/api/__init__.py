"""API package."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import api_router

root_api_router = APIRouter()
root_api_router.include_router(api_router, prefix="/v1")

__all__ = ["root_api_router"]