"""Training datasets for the Lumina AI layer.

The generators below are fully deterministic (fixing the RNG seed) so model
training is reproducible on every boot. The *signal structure* mirrors the
patterns found in public logistics datasets:

* Demand          - daily e-commerce / retail delivery volumes with weekday,
                    festival (Diwali / Pongal / Durga Puja), monsoon and a
                    long-term growth trend (Kaggle "E-commerce delivery time",
                    "Retail supply chain sales" + India retail-spend seasonality).
* Maintenance     - fleet service logs with odometer, service interval and
                    health degradation (public fleet telematics / workshop
                    logbook patterns).
* Assignment      - historically preferred vehicle-per-shipment choices whose
                    utility we re-learn (cost-efficiency-first policy).
* Fuel / eco      - road-freight fuel consumption vs distance, load and vehicle
                    class (EPA / NREL medium- and heavy-duty fuel economy,
                    IRU freight benchmarks).

The CSVs are exported to ``<backend>/data/raw/`` for inspection and can be
replaced with real production exports of the *same schema* without touching
any model code.
"""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"

VEHICLE_TYPE_CODES = {"heavy-truck": 0, "mini-truck": 1, "tempo": 2, "delivery-van": 3}

# Priors used by the generators (documented business assumptions).
CLASS_INTERVAL_KM = {"heavy-truck": 20000, "mini-truck": 12000, "tempo": 8000, "delivery-van": 10000}
CLASS_MILEAGE = {"heavy-truck": 5.0, "mini-truck": 7.5, "tempo": 14.0, "delivery-van": 12.0}
CLASS_CAPACITY_KG = {"heavy-truck": 10000, "mini-truck": 5000, "tempo": 1200, "delivery-van": 800}
CLASS_SPEED_KMH = {"heavy-truck": 45, "mini-truck": 40, "tempo": 35, "delivery-van": 32}


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


# ---------------------------------------------------------------------------
# 1. Demand forecasting
# ---------------------------------------------------------------------------

DAILY_SPIKE = {0: 1.00, 1: 1.06, 2: 1.11, 3: 1.16, 4: 1.10, 5: 1.22, 6: 0.90}
FESTIVAL_WINDOWS = [  # (start_day, start_month, end_day, end_month, factor)
    (20, 10, 2, 11, 1.75),   # Diwali (Oct-Nov)
    (9, 1, 17, 1, 1.45),     # Pongal (Jan)
    (3, 10, 13, 10, 1.5),    # Durga Puja (early Oct)
    (20, 3, 2, 4, 1.35),     # Eid-al-Fitr-ish spring peak
]


def _festival_factor(d: date) -> float:
    for ds, ms, de, me, factor in FESTIVAL_WINDOWS:
        start = date(d.year, ms, ds)
        end = date(d.year, me, de)
        if start <= d <= end:
            return factor
        # window crossing a year boundary
        start_prev = date(d.year - 1, ms, ds)
        end_prev = date(d.year - 1, me, de)
        if start_prev <= d <= end_prev:
            return factor
    return 1.0


def _is_monsoon(d: date) -> float:
    return 0.92 if (6 <= d.month <= 9) else 1.0


def generate_demand(n_days: int = 730, start: date | None = None) -> pd.DataFrame:
    """Daily shipment demand with seasonality, festivals and growth trend."""
    rng = _rng(7)
    start = start or date.today() - timedelta(days=n_days)
    dates = [start + timedelta(days=i) for i in range(n_days)]

    rows: list[dict[str, object]] = []
    for t, d in enumerate(dates):
        base = 42.0 * (1 + 0.55 * (t / n_days))          # 2-yr growth trend
        base *= DAILY_SPIKE[d.weekday()]                  # weekday rhythm
        base *= _festival_factor(d)                       # festival spikes
        base *= _is_monsoon(d)                            # monsoon dampening
        base *= 1 + 0.12 * np.sin(2 * np.pi * (d.timetuple().tm_yday + 120) / 365.25)
        noise = rng.normal(0, 0.035)
        rows.append(
            {
                "date": d,
                "shipments": max(5.0, round(base * (1 + noise), 1)),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 2. Predictive maintenance
# ---------------------------------------------------------------------------

def generate_maintenance(n_vehicles: int = 120, seed: int = 11) -> pd.DataFrame:
    """Service history for a synthetic fleet (no IoT - logbook/odometer only)."""
    rng = _rng(seed)
    types = list(VEHICLE_TYPE_CODES)
    rows: list[dict[str, object]] = []

    for _ in range(n_vehicles):
        vtype = types[rng.integers(0, len(types))]
        interval = int(CLASS_INTERVAL_KM[vtype])
        mileage = CLASS_MILEAGE[vtype]
        capacity = CLASS_CAPACITY_KG[vtype]

        age_months = float(rng.integers(4, 130))                       # 0.3-10y
        daily_km = float(rng.normal(180.0 if vtype in ("heavy-truck", "mini-truck") else 90.0, 55.0))
        daily_km = max(daily_km, 15.0)
        odo_start = age_months * 30 * daily_km
        # one to three completed service intervals + current open interval
        completed = int(rng.integers(1, 4))
        service_log = [odo_start - completed * interval + rng.normal(0, 40) for _ in range(completed)]
        km_since = float(odo_start - max(service_log)) if service_log else float(odo_start)

        # Health degrades with km-since-service, age and utilisation pressure.
        health = (
            98.0
            - 0.00055 * max(km_since, 0)
            - 0.09 * age_months
            - 0.02 * max(daily_km - 140, 0) * (age_months / 48)
        )
        health = float(np.clip(health + rng.normal(0, 3.5), 25, 100))

        w_cap = rng.uniform(0.35, 0.95)
        rows.append(
            {
                "vehicle_id": f"v{_:03d}",
                "vehicle_type": vtype,
                "type_code": VEHICLE_TYPE_CODES[vtype],
                "age_months": round(age_months, 1),
                "odometer_km": round(odo_start, 0),
                "km_since_service": round(km_since, 0),
                "service_interval_km": interval,
                "avg_daily_km": round(daily_km, 1),
                "typical_load_ratio": round(w_cap, 2),
                "mileage_kmpl": mileage,
                "km_to_service": round(interval - km_since, 0),
                "health_score": round(health, 1),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 3. AI vehicle assignment (learned preference policy)
# ---------------------------------------------------------------------------

def generate_assignments(n_rows: int = 2400, seed: int = 23) -> pd.DataFrame:
    """Historical (shipment, vehicle) choice records with a utility label.

    The utility label is *derived from the features* using the documented
    cost-first policy (cost 40%, fuel 20%, availability 15%, health 15%,
    capacity 10%). The model therefore re-learns an interpretable, causal
    policy from data instead of memorising random scores.
    """
    rng = _rng(seed)
    types = list(VEHICLE_TYPE_CODES)
    rows: list[dict[str, object]] = []

    for _ in range(n_rows):
        vtype = types[rng.integers(0, len(types))]
        capacity = float(CLASS_CAPACITY_KG[vtype])
        mileage = CLASS_MILEAGE[vtype] * rng.uniform(0.85, 1.15)
        cost_per_km = capacity * rng.uniform(0.0016, 0.0044)  # ₹/km scales with class
        health = float(rng.uniform(45, 100))
        avail = float(rng.choice([0.0, 1.0], p=[0.2, 0.8]))
        distance = float(rng.uniform(60, 700))
        weight = float(rng.uniform(0.15, 1.05) * capacity)

        # Feature-derived sub-scores (this is what makes the label learnable).
        cost_score = float(np.clip(1.0 - cost_per_km / 50.0, 0.0, 1.0))
        fuel_score = float(np.clip(mileage / 14.0, 0.2, 1.0))
        avail_score = avail
        health_score = health / 100.0
        capfit_score = 0.0 if weight > capacity else 1.0

        utility = np.clip(
            0.40 * cost_score
            + 0.20 * fuel_score
            + 0.15 * avail_score
            + 0.15 * health_score
            + 0.10 * capfit_score
            + rng.normal(0, 0.05),
            0.0,
            1.0,
        )

        rows.append(
            {
                "vehicle_type": vtype,
                "type_code": VEHICLE_TYPE_CODES[vtype],
                "capacity_kg": capacity,
                "weight_kg": weight,
                "distance_km": distance,
                "mileage_kmpl": round(mileage, 2),
                "cost_per_km": round(cost_per_km, 2),
                "health_score": round(health, 1),
                "available": avail,
                "utility": float(utility),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 4. Fuel / emissions (green logistics)
# ---------------------------------------------------------------------------

def generate_fuel(n_rows: int = 3000, seed: int = 31) -> pd.DataFrame:
    """Fuel consumption vs distance, load and vehicle class (no IoT - invoices/waybills)."""
    rng = _rng(seed)
    types = list(VEHICLE_TYPE_CODES)
    rows: list[dict[str, object]] = []

    for _ in range(n_rows):
        vtype = types[rng.integers(0, len(types))]
        capacity = float(CLASS_CAPACITY_KG[vtype])
        mileage = CLASS_MILEAGE[vtype] * rng.uniform(0.85, 1.18)
        distance = float(rng.uniform(50, 750))
        load_ratio = float(rng.uniform(0.2, 1.0))
        weight = load_ratio * capacity

        # Load factor raises effective consumption vs empty-running baseline.
        fuel = (distance / mileage) * (1.0 + 0.25 * load_ratio) + rng.normal(0, distance / mileage * 0.05)
        rows.append(
            {
                "vehicle_type": vtype,
                "type_code": VEHICLE_TYPE_CODES[vtype],
                "distance_km": round(distance, 1),
                "weight_kg": round(weight, 0),
                "load_ratio": round(load_ratio, 2),
                "mileage_kmpl": round(mileage, 2),
                "fuel_l": round(max(fuel, 0.5), 2),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------

def export_all() -> dict[str, int]:
    """Generate + write all CSVs to ``data/raw``. Returns {dataset: row count}."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    size_by_name: dict[str, int] = {}
    for name, frame in (
        ("demand", generate_demand()),
        ("maintenance", generate_maintenance()),
        ("assignments", generate_assignments()),
        ("fuel", generate_fuel()),
    ):
        path = DATA_DIR / f"{name}.csv"
        frame.to_csv(path, index=False)
        size_by_name[name] = int(len(frame))
    return size_by_name


def load_csv(name: str) -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / f"{name}.csv")


if __name__ == "__main__":
    from pprint import pprint

    pprint(export_all())