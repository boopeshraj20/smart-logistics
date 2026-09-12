"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Runtime settings. Copy `backend/.env.example` to `backend/.env`."""

    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Lumina Logistics API"
    app_version: str = "0.1.0"
    debug: bool = False
    api_prefix: str = "/api"

    # OpenRouteService free-tier key for real road routing.
    ors_api_key: str = Field(default="", description="OpenRouteService API key")
    ors_base_url: str = "https://api.openrouteservice.org"
    ors_profile: str = "driving-hgv"

    # Set CORS_ORIGINS to a JSON array in production, for example:
    # ["https://your-app.vercel.app"]
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Simulation defaults.
    vehicle_avg_speed_kmh: float = 48.0
    fuel_price_per_l: float = 90.5
    co2_per_litre_fuel: float = 2.68  # kg CO2 per litre of diesel


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()