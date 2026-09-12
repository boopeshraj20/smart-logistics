"""Async client for the OpenRouteService public API (free tier)."""

from __future__ import annotations

import logging
import time

import httpx

from app.core.config import settings

logger = logging.getLogger("lumina.ors")


def _masked_key(key: str) -> str:
    """Safe, key-preserving diagnostic form: never expose the secret itself."""
    if not key:
        return "<EMPTY - no ORS key configured>"
    if len(key) <= 8:
        return f"{key[0]}*** (len={len(key)})"
    return f"{key[:4]}...{key[-4:]} (len={len(key)})"


# Report key configuration once at startup so a wrong/missing key is obvious.
logger.info(
    "ORS config loaded: api_key=%s base_url=%s default_profile=%s",
    _masked_key(settings.ors_api_key),
    settings.ors_base_url,
    settings.ors_profile,
)


class OrsError(RuntimeError):
    """Raised when OpenRouteService returns an error or is unreachable."""


def _headers() -> dict[str, str]:
    return {"Authorization": settings.ors_api_key}


class OrsClient:
    """Thin async wrapper around the ORS v2 REST endpoints used by the app."""

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or settings.ors_base_url).rstrip("/")

    async def directions(
        self,
        profile: str,
        coords: list[tuple[float, float]],
        units: str = "km",
    ) -> dict:
        """Real road route between ordered [lng, lat] coordinates."""
        url = f"{self.base_url}/v2/directions/{profile}/geojson"
        payload = {"coordinates": coords, "units": units}
        logger.info(
            "ORS directions: POST %s profile=%s coords=%d first=%s last=%s units=%s auth=%s",
            url,
            profile,
            len(coords),
            coords[0] if coords else "-",
            coords[-1] if coords else "-",
            units,
            _masked_key(settings.ors_api_key),
        )
        started = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    url,
                    headers=_headers(),
                    json=payload,
                )
        except httpx.HTTPError as exc:
            logger.error(
                "ORS request failed before completing: %s (elapsed %.1fs)",
                exc,
                time.monotonic() - started,
                exc_info=True,
            )
            raise OrsError(f"ORS network error while contacting OpenRouteService: {exc}") from exc

        elapsed = time.monotonic() - started
        logger.info(
            "ORS directions response: status=%d elapsed=%.1fs body=%r",
            resp.status_code,
            elapsed,
            resp.text[:300],
        )
        self._raise(resp, elapsed=elapsed)
        return resp.json()

    async def geocode_search(self, text: str, country: str = "IN", size: int = 6) -> dict:
        """Forward geocoding endpoint (returns GeoJSON FeatureCollection)."""
        url = f"{self.base_url}/geocode/search"
        params: dict[str, str | int] = {"api_key": settings.ors_api_key, "text": text, "size": size}
        logger.info(
            "ORS geocode: GET %s params=%r auth=%s",
            url,
            params,
            _masked_key(settings.ors_api_key),
        )
        started = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params=params)
        except httpx.HTTPError as exc:
            logger.error(
                "ORS geocode request failed: %s (elapsed %.1fs)",
                exc,
                time.monotonic() - started,
                exc_info=True,
            )
            raise OrsError(f"ORS network error while geocoding: {exc}") from exc
        logger.info(
            "ORS geocode response: status=%d elapsed=%.1fs body=%r",
            resp.status_code,
            time.monotonic() - started,
            resp.text[:300],
        )
        self._raise(resp)
        return resp.json()

    async def reverse(self, lon: float, lat: float) -> dict:
        """Reverse geocoding endpoint."""
        url = f"{self.base_url}/geocode/reverse"
        params: dict[str, str | float | int] = {
            "api_key": settings.ors_api_key,
            "point.lon": lon,
            "point.lat": lat,
            "size": 1,
        }
        logger.info("ORS reverse: GET %s lon=%s lat=%s auth=%s", url, lon, lat, _masked_key(settings.ors_api_key))
        started = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params=params)
        except httpx.HTTPError as exc:
            logger.error(
                "ORS reverse request failed: %s (elapsed %.1fs)",
                exc,
                time.monotonic() - started,
                exc_info=True,
            )
            raise OrsError(f"ORS network error while reverse-geocoding: {exc}") from exc
        logger.info(
            "ORS reverse response: status=%d elapsed=%.1fs body=%r",
            resp.status_code,
            time.monotonic() - started,
            resp.text[:300],
        )
        self._raise(resp)
        return resp.json()

    @staticmethod
    def _raise(resp: httpx.Response, elapsed: float | None = None) -> None:
        if resp.is_success:
            return
        detail = resp.text[:300]
        if resp.status_code == 429:
            logger.warning(
                "ORS rate-limited (429). status=%d body=%r elapsed=%.1fs", resp.status_code, detail, elapsed or 0
            )
            raise OrsError("OpenRouteService rate limit reached. Waiting and retry later.")
        if resp.status_code in (401, 403):
            logger.warning(
                "ORS auth rejected (%d). status=%d body=%r elapsed=%.1fs",
                resp.status_code,
                resp.status_code,
                detail,
                elapsed or 0,
            )
            raise OrsError("Invalid OpenRouteService API key. Check ORS_API_KEY in backend/.env.")
        logger.warning(
            "ORS error. status=%d body=%r elapsed=%.1fs", resp.status_code, detail, elapsed or 0
        )
        raise OrsError(f"OpenRouteService error {resp.status_code}: {detail}")


ors = OrsClient()