"""Routing and geocoding endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.routing import GeoSearchResult, OptimizeRequest, OptimizeResult
from app.services.ors import OrsError, ors
from app.services.routing import compute_optimized_route

router = APIRouter(tags=["routing"])


@router.post("/routes/optimize", response_model=OptimizeResult)
async def optimize(req: OptimizeRequest) -> OptimizeResult:
    """Real-road route optimization (OpenRouteService / OSM road network)."""
    try:
        return await compute_optimized_route(req)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except OrsError as exc:
        # Surface the real ORS reason instead of silently degrading the route.
        raise HTTPException(status_code=502, detail=f"Routing service unreachable: {exc}") from exc


@router.get("/geo/search", response_model=list[GeoSearchResult])
async def geo_search(text: str = Query(min_length=2), country: str = "IN") -> list[GeoSearchResult]:
    """Forward-geocoding location search (proxied to ORS, hides the key)."""
    try:
        data = await ors.geocode_search(text, country=country, size=6)
    except OrsError:
        return []  # graceful: no results instead of surfacing key/network errors
    results: list[GeoSearchResult] = []
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        lon, lat = feature["geometry"]["coordinates"]
        results.append(
            GeoSearchResult(
                name=props.get("name") or props.get("label") or "",
                label=props.get("label") or "",
                region=props.get("region") or "",
                country=props.get("country") or "",
                longitude=lon,
                latitude=lat,
            )
        )
    return results


@router.get("/geo/reverse")
async def geo_reverse(lat: float = Query(...), lng: float = Query(...)) -> dict[str, str]:
    """Reverse-geocoding for map click selection."""
    try:
        data = await ors.reverse(lng, lat)
    except OrsError:
        return {"label": f"{lat:.4f}, {lng:.4f}"}  # graceful lat/lng label
    features = data.get("features", [])
    if not features:
        return {"label": f"{lat:.4f}, {lng:.4f}"}
    label = features[0]["properties"].get("label") or f"{lat:.4f}, {lng:.4f}"
    return {"label": label}