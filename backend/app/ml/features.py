"""Feature engineering for the AI layer.

Every model is fit on a fixed, documented feature set. The same functions are
used at train time and inference time so the deployed model always sees the
exact transformations it was trained on.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd

# Human-readable labels attached to each model's feature columns. These power
# the "factors considered" section of every prediction.
FEATURE_LABELS: dict[str, dict[str, str]] = {
    "demand": {
        "trend": "Demand growth trend",
        "weekday": "Day of week",
        "is_weekend": "Weekend day",
        "festival": "Festival season",
        "monsoon": "Monsoon month",
        "lag_7": "Demand last week",
        "rolling_7": "7-day rolling average",
    },
    "maintenance": {
        "age_months": "Vehicle age (months)",
        "odometer_km": "Odometer reading",
        "km_since_service": "Km since last service",
        "service_interval_km": "Recommended service interval",
        "avg_daily_km": "Average daily distance",
        "type_code": "Vehicle class",
    },
    "assignment": {
        "cost_per_km": "Operating cost per km",
        "co2_per_km": "CO₂ per km",
        "fuel_per_km": "Fuel use per km",
        "mileage_kmpl": "Fuel efficiency",
        "health_score": "Fleet health score",
        "availability": "Vehicle availability",
        "capacity_fit": "Capacity fit for load",
        "distance_km": "Trip distance",
        "weight_kg": "Cargo weight",
    },
    "fuel": {
        "distance_km": "Trip distance",
        "weight_kg": "Cargo weight",
        "load_ratio": "Load utilisation ratio",
        "type_code": "Vehicle class",
        "mileage_kmpl": "Fuel efficiency",
    },
}

CO2_PER_LITRE = 2.68  # kg CO₂ per litre of diesel (matches app config)


# ---------------------------------------------------------------------------
# Demand
# ---------------------------------------------------------------------------

def demand_features(df: pd.DataFrame) -> pd.DataFrame:
    """Turn a date-indexed demand frame into model features (demand)."""
    out = df.copy()
    out["date"] = pd.to_datetime(out["date"])
    out["trend"] = np.arange(len(out)) / max(len(out) - 1, 1)
    out["weekday"] = out["date"].dt.weekday.astype(float)
    out["is_weekend"] = (out["date"].dt.weekday >= 5).astype(float)
    d = out["date"]
    out["monsoon"] = ((d.dt.month >= 6) & (d.dt.month <= 9)).astype(float)
    out["festival"] = _festival_window(d.dt.month, d.dt.day).astype(float)
    out["rolling_7"] = out["shipments"].rolling(7, min_periods=1).mean().shift(1).fillna(0)
    out["lag_7"] = out["shipments"].shift(7).fillna(out["shipments"].mean())
    return out


def _festival_window(month: pd.Series, day: pd.Series) -> pd.Series:
    """1.0 during festival windows (training mirror of ``datasets`` logic)."""
    windows: list[tuple[int, int, int, int]] = [
        (10, 20, 11, 2),
        (1, 9, 1, 17),
        (10, 3, 10, 13),
        (3, 20, 4, 2),
    ]
    flag = pd.Series(0.0, index=month.index)
    for m_start, d_start, m_end, d_end in windows:
        in_win = (
            ((month > m_start) & (month < m_end))
            | ((month == m_start) & (day >= d_start))
            | ((month == m_end) & (day <= d_end))
        )
        flag = flag.where(~in_win, 1.0)
    return flag


DEMAND_FEATURES = ["trend", "weekday", "is_weekend", "festival", "monsoon", "lag_7", "rolling_7"]
DEMAND_TARGET = "shipments"


# ---------------------------------------------------------------------------
# Maintenance
# ---------------------------------------------------------------------------

MAINT_FEATURES = [
    "age_months",
    "odometer_km",
    "km_since_service",
    "service_interval_km",
    "avg_daily_km",
    "type_code",
]
MAINT_TARGET_HEALTH = "health_score"
MAINT_TARGET_SERVICE = "km_to_service"


# ---------------------------------------------------------------------------
# Assignment
# ---------------------------------------------------------------------------

def assignment_features(normalized: dict[str, float]) -> dict[str, float]:
    """Per-candidate raw features for the assignment model (inference helper)."""
    return {
        "cost_per_km": normalized["cost_per_km"],
        "co2_per_km": normalized["co2_per_km"],
        "fuel_per_km": normalized["fuel_per_km"],
        "mileage_kmpl": normalized["mileage_kmpl"],
        "health_score": normalized["health_score"] / 100.0,
        "availability": 1.0 if normalized["available"] else 0.0,
        "capacity_fit": 1.0 if normalized["capacity_kg"] >= normalized["weight_kg"] else 0.0,
        "distance_km": normalized["distance_km"],
        "weight_kg": normalized["weight_kg"],
    }


ASSIGNMENT_FEATURES = list(FEATURE_LABELS["assignment"])


# ---------------------------------------------------------------------------
# Fuel / eco
# ---------------------------------------------------------------------------

def fuel_features(distance_km: float, weight_kg: float, capacity_kg: float, type_code: int, mileage_kmpl: float) -> dict[str, float]:
    return {
        "distance_km": distance_km,
        "weight_kg": weight_kg,
        "load_ratio": min(weight_kg / max(capacity_kg, 1.0), 2.0),
        "type_code": float(type_code),
        "mileage_kmpl": mileage_kmpl,
    }


FUEL_FEATURES = list(FEATURE_LABELS["fuel"])


# ---------------------------------------------------------------------------
# Generic inference helpers
# ---------------------------------------------------------------------------

def ist_now() -> datetime:
    return datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=5, minutes=30)))