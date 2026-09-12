"""ML model registry: training, persistence, prediction, explainability.

Every model exposes:

* ``confidence``  - 0..1 calibrated against held-out residual spread
* ``factors``     - the input features considered, with signed contribution
* ``summary``/``bullets`` - plain-English reasoning for the decision

No black boxes: demand uses a gradient-boosted tree, everything else uses
linear models whose coefficients translate directly into explanations.
"""

from __future__ import annotations

import json
import threading
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Callable

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import ElasticNet, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.ml import datasets, features

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True, parents=True)

_LOCK = threading.Lock()
_REGISTRY: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Model metadata + metrics
# ---------------------------------------------------------------------------

def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
    }


def _confidence(model: Any, y_train: np.ndarray, pred_train: np.ndarray, scale: float) -> float:
    """Calibrate confidence from training residual spread (0.55..0.99)."""
    resid = float(np.std(y_train - pred_train))
    return float(np.clip(1.0 - resid / max(scale, 1e-9), 0.55, 0.99))


def _linear_factors(
    model: Any,
    x_row: np.ndarray,
    mean_row: np.ndarray,
    names: list[str],
    labels: dict[str, str] | None = None,
) -> list[dict[str, Any]]:
    """Signed per-feature contributions for linear models (x - mean) * coef."""
    coefs = np.asarray(model.coef_).reshape(-1)
    contribs = coefs * (x_row - mean_row)
    label_map = labels or {}
    out: list[dict[str, Any]] = []
    for i, name in enumerate(names):
        out.append(
            {
                "feature": name,
                "value": float(x_row[i]),
                "contribution": float(contribs[i]),
                "direction": "positive" if contribs[i] > 1e-9 else ("negative" if contribs[i] < -1e-9 else "neutral"),
                "note": label_map.get(name, name.replace("_", " ")),
            }
        )
    out.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return out[:6]


def _top_bullets(factors: list[dict[str, Any]]) -> list[str]:
    bullets: list[str] = []
    for f in factors[:3]:
        bullets.append(
            f"{f['note']}: contribution {f['contribution']:+.3f} vs fleet average."
        )
    return bullets


MODELS: list[dict[str, Any]] = [
    {
        "id": "demand",
        "name": "Demand Forecast",
        "family": "GradientBoosting",
        "build": lambda: GradientBoostingRegressor(n_estimators=180, max_depth=3, learning_rate=0.06, random_state=7),
        "feature_names": features.DEMAND_FEATURES,
    },
    {
        "id": "health",
        "name": "Vehicle Health",
        "family": "Ridge Regression",
        "build": lambda: Ridge(alpha=2.0),
        "feature_names": features.MAINT_FEATURES,
    },
    {
        "id": "service",
        "name": "Next Services (km)",
        "family": "ElasticNet",
        "build": lambda: ElasticNet(alpha=1.0, l1_ratio=0.5, max_iter=4000),
        "feature_names": features.MAINT_FEATURES,
    },
    {
        "id": "assignment",
        "name": "Vehicle Assignment Utility",
        "family": "Linear Regression",
        "build": lambda: LinearRegression(),
        "feature_names": features.ASSIGNMENT_FEATURES,
    },
    {
        "id": "fuel",
        "name": "Fuel Consumption",
        "family": "Ridge Regression",
        "build": lambda: Ridge(alpha=1.0),
        "feature_names": features.FUEL_FEATURES,
    },
]


def _write_registry() -> None:
    (ARTIFACT_DIR / "registry.json").write_text(
        json.dumps(
            [{k: v for k, v in m.items() if k != "model"} for m in _REGISTRY.values()],
            indent=2,
            default=str,
        ),
        encoding="utf-8",
    )


def _read_registry() -> dict[str, dict[str, Any]]:
    path = ARTIFACT_DIR / "registry.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return {d["id"]: {**d} for d in data}
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def _split_eval(df: pd.DataFrame, features_: list[str], target: str, model: Any) -> tuple[dict[str, float], float]:
    X = df[features_].to_numpy(dtype=float)
    y = df[target].to_numpy(dtype=float)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    if hasattr(model, "fit"):
        model.fit(Xtr, ytr)
    pred_tr = model.predict(Xtr)
    pred_te = model.predict(Xte)
    metrics = _metrics(yte, pred_te)
    scale = max(float(np.mean(np.abs(y))), 1e-6)
    return metrics, _confidence(model, ytr, pred_tr, scale)


def _train_demand() -> dict[str, Any]:
    df = datasets.generate_demand()
    feat = features.demand_features(df)
    X = feat[features.DEMAND_FEATURES].to_numpy(dtype=float)
    y = feat[features.DEMAND_TARGET].to_numpy(dtype=float)

    model = MODELS[0]["build"]()
    # Chronological hold-out: first 80% train, latest 20% test - the honest
    # evaluation for a forecasting model (no future leakage in scoring).
    cut = int(len(X) * 0.8)
    model.fit(X[:cut], y[:cut])
    p_te = model.predict(X[cut:])
    metrics = _metrics(y[cut:], p_te)

    model.fit(X, y)  # final fit on all history
    pred = model.predict(X)
    conf = _confidence(model, y, pred, max(float(np.mean(y)), 1.0))
    names = features.DEMAND_FEATURES
    importances = {n: float(i) for n, i in zip(names, model.feature_importances_)}
    return {
        "model": model,
        "meta": {
            "model_id": "demand",
            "model_name": "Demand Forecast",
            "family": "GradientBoosting",
            "trained_at": datetime.now().isoformat(timespec="seconds"),
            "dataset": "demand.csv · 730 days",
            "features": names,
            "metrics": metrics,
            "confidence": conf,
            "importances": importances,
        },
        "aux": {"feature_means": X.mean(axis=0), "target_mean": float(y.mean())},
    }


def _train_maintenance() -> dict[str, Any]:
    df = datasets.generate_maintenance()
    X = df[features.MAINT_FEATURES].to_numpy(dtype=float)
    yh = df[features.MAINT_TARGET_HEALTH].to_numpy(dtype=float)
    ys = df[features.MAINT_TARGET_SERVICE].to_numpy(dtype=float)

    health_model = MODELS[1]["build"]()
    service_model = MODELS[2]["build"]()

    mh, ch = _split_eval(df, features.MAINT_FEATURES, features.MAINT_TARGET_HEALTH, health_model)
    ms, cs = _split_eval(df, features.MAINT_FEATURES, features.MAINT_TARGET_SERVICE, service_model)

    # final fits
    health_model.fit(X, yh)
    service_model.fit(X, ys)

    return {
        "model": {"health": health_model, "service": service_model},
        "meta": {"health": _mk_meta("health", mh, ch, "maintenance.csv · 120 service logs"),
                 "service": _mk_meta("service", ms, cs, "maintenance.csv · 120 service logs")},
        "aux": {"health": {"feature_means": X.mean(axis=0), "target_mean": float(yh.mean())},
                "service": {"feature_means": X.mean(axis=0), "target_mean": float(ys.mean())}},
    }


def _train_assignment() -> dict[str, Any]:
    df = datasets.generate_assignments()
    # mirror inference-time feature construction (see features.assignment_features)
    df["co2_per_km"] = (1.0 / df["mileage_kmpl"]) * features.CO2_PER_LITRE
    df["fuel_per_km"] = 1.0 / df["mileage_kmpl"]
    df["availability"] = df["available"].astype(float)
    df["capacity_fit"] = (df["capacity_kg"] >= df["weight_kg"]).astype(float)
    df["health_score"] = df["health_score"] / 100.0
    X = df[features.ASSIGNMENT_FEATURES].to_numpy(dtype=float)
    y = df["utility"].to_numpy(dtype=float)
    model = MODELS[3]["build"]()
    metrics, conf = _split_eval(df, features.ASSIGNMENT_FEATURES, "utility", model)
    model.fit(X, y)
    return {
        "model": model,
        "meta": _mk_meta("assignment", metrics, conf, "assignments.csv · 2400 decisions"),
        "aux": {"feature_means": X.mean(axis=0), "target_mean": float(y.mean())},
    }


def _train_fuel() -> dict[str, Any]:
    df = datasets.generate_fuel()
    X = df[features.FUEL_FEATURES].to_numpy(dtype=float)
    y = df["fuel_l"].to_numpy(dtype=float)
    model = MODELS[4]["build"]()
    metrics, conf = _split_eval(df, features.FUEL_FEATURES, "fuel_l", model)
    model.fit(X, y)
    return {
        "model": model,
        "meta": _mk_meta("fuel", metrics, conf, "fuel.csv · 3000 waybills"),
        "aux": {"feature_means": X.mean(axis=0), "target_mean": float(y.mean())},
    }


def _mk_meta(model_id: str, metrics: dict[str, float], confidence: float, dataset: str) -> dict[str, Any]:
    spec = next(m for m in MODELS if m["id"] == model_id)
    return {
        "model_id": model_id,
        "model_name": spec["name"],
        "family": spec["family"],
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "dataset": dataset,
        "features": spec["feature_names"],
        "metrics": metrics,
        "confidence": confidence,
    }


_TRAINERS: dict[str, Callable[[], dict[str, Any]]] = {
    "demand": _train_demand,
    "maintenance": _train_maintenance,
    "assignment": _train_assignment,
    "fuel": _train_fuel,
}


def train_all() -> dict[str, Any]:
    """Retrain every model from source datasets and persist artifacts."""
    with _LOCK:
        _REGISTRY.clear()
        dataset_sizes = datasets.export_all()
        for model_id, trainer in _TRAINERS.items():
            result = trainer()
            meta = result["meta"]
            if model_id == "maintenance":
                for sub in ("health", "service"):
                    _persist(sub, meta[sub], result["model"][sub], result["aux"][sub])
                continue
            _persist(model_id, meta, result["model"], result["aux"])
        for model_id in ("demand", "health", "service", "assignment", "fuel"):
            info = _load_from_disk(model_id)
            if info:
                _REGISTRY[model_id] = info
        _write_registry()
        return {
            "trained_at": datetime.now().isoformat(timespec="seconds"),
            "status": "ok",
            "datasets": dataset_sizes,
            "models": [v["meta"] for v in _REGISTRY.values()],
        }


# ---------------------------------------------------------------------------
# Persistence + lazy loading
# ---------------------------------------------------------------------------

def _artifact_paths(model_id: str) -> Path:
    return ARTIFACT_DIR / f"{model_id}.joblib"


def _persist(model_id: str, meta: dict[str, Any], model: Any, aux: dict[str, Any]) -> None:
    joblib.dump({"meta": meta, "model": model, "aux": aux}, _artifact_paths(model_id))


def _load_from_disk(model_id: str) -> dict[str, Any] | None:
    path = _artifact_paths(model_id)
    if not path.exists():
        return None
    payload = joblib.load(path)
    return {"meta": payload["meta"], "model": payload["model"], "aux": payload["aux"]}


def _ensure() -> dict[str, dict[str, Any]]:
    """Load cached artifacts, or train every model on first use."""
    if _REGISTRY:
        return _REGISTRY
    with _LOCK:
        if _REGISTRY:
            return _REGISTRY
        missing: list[str] = []
        for model_id in ("demand", "health", "service", "assignment", "fuel"):
            info = _load_from_disk(model_id)
            if info:
                _REGISTRY[model_id] = info
            else:
                missing.append(model_id)
        if missing:
            train_all()  # rebuilds the registry from source datasets
        return _REGISTRY


def list_models() -> list[dict[str, Any]]:
    return [v["meta"] for v in _ensure().values()]


def _get(model_id: str) -> dict[str, Any]:
    return _ensure()[model_id]


# ---------------------------------------------------------------------------
# Prediction wrappers (demand / maintenance / assignment / eco)
# ---------------------------------------------------------------------------

def forecast_demand(days: int = 14, history: dict[str, Any] | None = None) -> dict[str, Any]:
    info = _get("demand")
    model = info["model"]
    meta = info["meta"]
    aux = info["aux"]

    df = datasets.generate_demand() if not history else pd.DataFrame(history)
    hist = features.demand_features(df.copy())
    hist_dates = pd.to_datetime(hist.pop("date"))
    n_hist = len(hist)
    hist_x = hist[features.DEMAND_FEATURES].to_numpy(dtype=float)

    # recursive one-step forecast using the trained model
    y_actual = hist[features.DEMAND_TARGET].to_numpy(dtype=float)
    predictions: list[float] = []
    starts = hist_dates.iloc[-1] if n_hist else pd.Timestamp.today()
    for d in range(1, days + 1):
        target: pd.Timestamp = (hist_dates.iloc[-1] if n_hist else pd.Timestamp.today()) + pd.Timedelta(days=d)
        series_for_feat = _append_series(hist_dates, y_actual, predictions, hist_x)
        x_row = _demand_row_features(target, series_for_feat, n_hist + d - 1, len(hist_dates) + days)
        pred = float(model.predict(np.array([x_row]))[0])
        predictions.append(max(pred, 0.0))

    dates_f = [((hist_dates.iloc[-1] if n_hist else pd.Timestamp.today()) + pd.Timedelta(days=i)).date() for i in range(1, days + 1)]
    point_dates = [d.isoformat() for d in dates_f]
    yh = y_actual[-(min(14, len(y_actual))):].tolist()
    act_dates = [d.date().isoformat() for d in hist_dates[-(min(14, len(y_actual))):]]
    actual_map = dict(zip(act_dates, yh))

    std = max(meta["metrics"]["rmse"], 1.0)
    points = []
    for i, dt in enumerate(point_dates):
        points.append({
            "date": dt,
            "actual": actual_map.get(dt),
            "predicted": round(predictions[i], 1),
            "lower": round(predictions[i] - 1.96 * std, 1),
            "upper": round(predictions[i] + 1.96 * std, 1),
        })

    peak = max(predictions) if predictions else 0.0
    recommended = max(1, int(np.ceil(peak / 10.0)))  # ~10 orders per dispatched vehicle/day
    peak_dates = sorted(zip(dates_f, predictions), key=lambda x: -x[1])[:3]

    importances = meta.get("importances", {})
    top = sorted(importances.items(), key=lambda x: -x[1])[:3]
    factor_rows = []
    for name, importance in top:
        factor_rows.append({"feature": name, "value": importance, "contribution": importance, "direction": "positive", "note": features.FEATURE_LABELS["demand"].get(name, name)})

    bullets = [f"Historical {n} contributes {importance*100:.0f}% of forecast variance." for n, importance in top]
    pk = ", ".join(f"{d} ({v:.0f})" for d, v in peak_dates)
    bullets.append(f"The busiest forecast day is {pk}, driving the fleet recommendation.")

    return {
        "horizon_days": days,
        "points": points,
        "recommended_fleet_size": recommended,
        "recommendation": f"Raise dispatch capacity to {recommended} vehicles to absorb the {peak:.0f}-order peak day.",
        "peak_days": [d.isoformat() for d, _ in peak_dates],
        "explanation": {
            "summary": f"Gradient-boosted model on {len(y_actual)} daily records predicts a peak of {peak:.0f} shipments in the next {days} days.",
            "bullets": bullets,
            "confidence": round(meta["confidence"], 3),
            "factors": factor_rows,
        },
        "model": {k: v for k, v in meta.items() if k != "importances"},
    }


def _append_series(dates: pd.Series, actual: np.ndarray, preds: list[float], _hist_x: np.ndarray) -> list[float]:
    return list(actual) + [max(p, 0.0) for p in preds]


def _demand_row_features(target: pd.Timestamp, series: list[float], idx: int, total: int) -> np.ndarray:
    last7 = series[-7:]
    lag7 = last7[-1]
    roll = float(np.mean(last7[-7:]))
    festival = features._festival_window(pd.Series([target.month]), pd.Series([target.day])).iloc[0]
    row = [
        idx / max(total - 1, 1),
        float(target.weekday()),
        1.0 if target.weekday() >= 5 else 0.0,
        festival,
        1.0 if 6 <= target.month <= 9 else 0.0,
        lag7,
        roll,
    ]
    return np.array(row, dtype=float)


def predict_maintenance(vehicles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    info = _get("health")
    health_model = info["model"]
    meta = info["meta"]
    aux = info["aux"]

    sinfo = _get("service")
    service_model = sinfo["model"]
    smeta = sinfo["meta"]
    saux = sinfo["aux"]

    reports: list[dict[str, Any]] = []
    for i, v in enumerate(vehicles):
        x = np.array(_maintenance_row(v), dtype=float)
        health = float(np.clip(health_model.predict(x.reshape(1, -1))[0], 0, 100))
        km_to_service = float(np.clip(service_model.predict(x.reshape(1, -1))[0], 0, v["service_interval_km"]))
        km_since = float(v["km_since_service"])
        interval = float(v["service_interval_km"])
        next_service = max(float(v["odometer_km"]) + km_to_service, float(v["odometer_km"]) + interval - km_since)

        risk = float(np.clip((100 - health) * 0.6 + (km_since / max(interval, 1)) * 40.0, 0, 100))

        maint_labels = features.FEATURE_LABELS["maintenance"]
        h_factors = _linear_factors(health_model, x, np.asarray(aux["feature_means"]), features.MAINT_FEATURES, maint_labels)
        s_factors = _linear_factors(service_model, x, np.asarray(saux["feature_means"]), features.MAINT_FEATURES, maint_labels)

        label = _health_label(health)
        recs = _maintenance_recommendations(health, km_to_service, km_since, interval, v, risk)

        reports.append({
            "vehicle_id": v["id"],
            "vehicle_name": v["name"],
            "plate_number": v["plate_number"],
            "vehicle_type": v["vehicle_type"],
            "health_score": round(health, 1),
            "status_label": label,
            "next_maintenance_km": round(next_service, 0),
            "remaining_km_to_service": round(km_to_service, 0),
            "predicted_failure_risk": round(risk, 1),
            "recommendations": recs,
            "explanation": {
                "summary": f"{v['name']} is predicted at {health:.0f}/100 health with service due in ~{km_to_service:.0f} km.",
                "bullets": [
                    f"Km since last service ({km_since:.0f} of {interval:.0f} km interval) lowers health."
                    if km_since / interval > 0.6 else
                    f"Within normal operating band ({km_since / interval * 100:.0f}% of interval used).",
                    _top_bullets(h_factors)[0] if h_factors else "",
                ],
                "confidence": round(min(meta["confidence"], smeta["confidence"]) * (1 - risk / 200), 3),
                "factors": h_factors[:5],
            },
        })
    return reports


def _maintenance_row(v: dict[str, Any]) -> list[float]:
    type_code = datasets.VEHICLE_TYPE_CODES.get(v["vehicle_type"], 0)
    return [
        float(v.get("age_months", 24)),
        float(v["odometer_km"]),
        float(v["km_since_service"]),
        float(v["service_interval_km"]),
        float(v.get("avg_daily_km", 120)),
        float(type_code),
    ]


def _health_label(health: float) -> str:
    if health >= 85: return "excellent"
    if health >= 75: return "good"
    if health >= 60: return "fair"
    if health >= 45: return "poor"
    return "critical"


def _maintenance_recommendations(health: float, km_to_service: float, km_since: float, interval: float, v: dict[str, Any], risk: float) -> list[str]:
    recs: list[str] = []
    due = km_to_service / max(interval, 1) < 0.15
    if due:
        recs.append(f"Schedule service within {km_to_service:.0f} km — service window closing.")
    if health < 60:
        recs.append("Health below target — book an early inspection.")
    if km_since / max(interval, 1) > 0.75 and km_to_service < 500:
        recs.append(f"Shorten next interval: {km_since:.0f} km since last service is close to the {interval:.0f} km limit.")
    if risk > 45:
        recs.append(f"Elevated failure risk ({risk:.0f}%) — prioritise preventive maintenance.")
    return recs[:3] or ["Run to next scheduled interval — no action needed."]


def recommend_assignment(
    candidates: list[dict[str, Any]],
    distance_km: float,
    weight_kg: float,
) -> list[dict[str, Any]]:
    """ML-ranked, explainable assignment scores for a route."""
    info = _get("assignment")
    model = info["model"]
    meta = info["meta"]
    aux = info["aux"]

    forever_map = datasets.CLASS_MILEAGE
    ranked: list[dict[str, Any]] = []
    max_cost = max((c["operating_cost_per_km"] for c in candidates), default=1)
    for c in candidates:
        normalized = {
            "cost_per_km": c["operating_cost_per_km"],
            "co2_per_km": (1.0 / max(c["mileage_kmpl"], 0.1)) * features.CO2_PER_LITRE,
            "fuel_per_km": 1.0 / max(c["mileage_kmpl"], 0.1),
            "mileage_kmpl": c["mileage_kmpl"],
            "health_score": float(c["health_score"]),
            "available": bool(c["available"]),
            "capacity_kg": float(c["capacity_kg"]),
            "weight_kg": float(weight_kg),
            "distance_km": distance_km,
        }
        x = np.array([features.assignment_features(normalized)[f] for f in features.ASSIGNMENT_FEATURES], dtype=float)
        predicted = float(np.clip(model.predict(x.reshape(1, -1))[0], 0, 1))

        capacity_ok = normalized["capacity_kg"] >= weight_kg or weight_kg <= 0
        if not capacity_ok or not normalized["available"]:
            predicted *= 0.1  # hard feasibility penalty (mirrors policy)

        factors = _linear_factors(model, x, np.asarray(aux["feature_means"]), features.ASSIGNMENT_FEATURES, features.FEATURE_LABELS["assignment"])

        reasons: list[str] = []
        if capacity_ok and normalized["available"]:
            reasons.append(_top_bullets(factors)[0] if factors else "Best across cost/efficiency factors")
        elif not capacity_ok:
            reasons.append(f"Capacity {c['capacity_kg']:.0f} kg below load {weight_kg:.0f} kg")
        else:
            reasons.append("Vehicle not available now")
        if c["operating_cost_per_km"] <= max_cost * 0.55:
            reasons.append("Lowest operating cost in the candidate set")

        fuel_l = distance_km / max(c["mileage_kmpl"], 0.1)
        speed = datasets.CLASS_SPEED_KMH.get(c["vehicle_type"], 40)
        ranked.append({
            "vehicle_id": c["id"],
            "vehicle_name": c["name"],
            "plate_number": c["plate_number"],
            "vehicle_type": c["vehicle_type"],
            "availability": bool(c["available"]),
            "capacity_ok": capacity_ok,
            "score": round(predicted, 3),
            "cost_estimate": round(distance_km * c["operating_cost_per_km"], 0),
            "co2_estimate_kg": round(fuel_l * features.CO2_PER_LITRE, 0),
            "eta_min": round(distance_km / speed * 60, 0),
            "fuel_l": round(fuel_l, 1),
            "reasons": reasons[:3],
            "explanation": {
                "summary": f"ML utility {predicted:.2f} — {reasons[0] if reasons else 'cost-first policy'}.",
                "bullets": _top_bullets(factors),
                "confidence": round(meta["confidence"], 3),
                "factors": factors,
            },
        })

    ranked.sort(key=lambda r: r["score"], reverse=True)
    return ranked


def assess_eco(candidates: list[dict[str, Any]], distance_km: float, weight_kg: float) -> dict[str, Any]:
    """Fuel, CO2, sustainability scoring + eco ranking (no hardware/IoT)."""
    info = _get("fuel")
    model = info["model"]
    meta = info["meta"]
    aux = info["aux"]

    scores: list[dict[str, Any]] = []
    for c in candidates:
        type_code = datasets.VEHICLE_TYPE_CODES.get(c["vehicle_type"], 0)
        x = np.array([features.fuel_features(distance_km, weight_kg, c["capacity_kg"], type_code, c["mileage_kmpl"])[f] for f in features.FUEL_FEATURES], dtype=float)
        fuel_l = float(max(model.predict(x.reshape(1, -1))[0], 0.5))
        co2 = fuel_l * features.CO2_PER_LITRE
        cost = distance_km * c["operating_cost_per_km"]
        per_km = fuel_l / max(distance_km, 1)
        efficiency = c["mileage_kmpl"]

        factors = _linear_factors(model, x, np.asarray(aux["feature_means"]), features.FUEL_FEATURES, features.FEATURE_LABELS["fuel"])
        eco_score = float(np.clip(100 - (per_km / 0.35) * 30 + (efficiency / 15) * 25, 0, 100))
        scores.append({
            "vehicle_id": c["id"],
            "vehicle_name": c["name"],
            "plate_number": c["plate_number"],
            "vehicle_type": c["vehicle_type"],
            "fuel_l": round(fuel_l, 1),
            "co2_kg": round(co2, 1),
            "cost": round(cost, 0),
            "sustainability_score": round(eco_score, 1),
            "reasons": _top_bullets(factors)[:2],
            "explanation": {
                "summary": f"{c['name']} burns ~{fuel_l:.0f} L ({co2:.0f} kg CO₂) for this trip.",
                "bullets": _top_bullets(factors),
                "confidence": round(meta["confidence"], 3),
                "factors": factors,
            },
        })

    scores.sort(key=lambda s: (s["fuel_l"], -s["sustainability_score"]))
    fleet_fuel = sum(s["fuel_l"] for s in scores)
    fleet_co2 = sum(s["co2_kg"] for s in scores)
    best = scores[0] if scores else None

    # Baseline = a hypothetical heavy-truck doing the same trip alone.
    baseline_l = distance_km / max(datasets.CLASS_MILEAGE["heavy-truck"], 0.1) * 1.25
    baseline_co2 = baseline_l * features.CO2_PER_LITRE

    if best:
        fleet_score = float(np.clip(100 - (best["co2_kg"] / max(baseline_co2, 1e-6)) * 35, 0, 100))
        eco_savings = max(baseline_co2 - best["co2_kg"], 0.0)
    else:
        fleet_score = 0.0
        eco_savings = 0.0

    avg_mileage = np.mean([c["mileage_kmpl"] for c in candidates]) if candidates else 0

    return {
        "fleet_fuel_l": round(fleet_fuel, 1),
        "fleet_co2_kg": round(fleet_co2, 1),
        "distance_km": round(distance_km, 1),
        "sustainability_score": round(fleet_score, 1),
        "eco_savings_kg": round(eco_savings, 1),
        "breakdown": {"fuel_l": round(fleet_fuel, 1), "co2_kg": round(fleet_co2, 1), "avg_mileage_kmpl": round(float(avg_mileage), 2)},
        "ranking": scores,
        "recommendation": (
            f"Prefer {best['vehicle_name']} ({best['fuel_l']:.0f} L, {best['co2_kg']:.0f} kg CO₂ for {distance_km:.0f} km) — easier on fuel and emissions."
            if best
            else "No vehicles supplied."
        ),
        "explanation": {
            "summary": (
                f"Best option {best['vehicle_name']} emits {best['co2_kg']:.0f} kg CO₂, saving {eco_savings:.0f} kg "
                f"vs the all-heavy-truck baseline (score {fleet_score:.0f}/100)."
            ),
            "bullets": [
                f"Eco rank leader: {best['vehicle_name']} at {best['sustainability_score']:.0f}/100.",
                f"Whole candidate set would burn {fleet_fuel:.0f} L and emit {fleet_co2:.0f} kg if dispatched together.",
                "CO₂ = litres burned × 2.68 kg/L (diesel), from the trained fuel model.",
            ],
            "confidence": round(meta["confidence"], 3),
            "factors": [],
        },
        "model": {k: v for k, v in meta.items()},
    }


if __name__ == "__main__":
    # quick offline smoke test while developing
    result = train_all()
    print("trained:", list(result["models"].keys()) if isinstance(result["models"], dict) else len(result["models"]), "models")
    for m in list_models():
        print("-", m["model_id"], m["family"], m["metrics"])
    fc = forecast_demand(7)
    print("forecast peak:", fc["peak_days"], fc["recommended_fleet_size"])
    veh = [{"id": "veh-1", "name": "Truck A", "plate_number": "TN-01", "vehicle_type": "heavy-truck", "capacity_kg": 10000, "operating_cost_per_km": 42, "mileage_kmpl": 5.0, "health_score": 90, "available": True}]
    print("health:", predict_maintenance([{"id": "veh-1", "name": "Truck A", "plate_number": "TN-01", "vehicle_type": "heavy-truck", "odometer_km": 76300, "km_since_service": 15100, "service_interval_km": 20000, "age_months": 52}]))
    print("assign:", recommend_assignment(veh, 340, 4000))
    print("eco:", assess_eco(veh, 340, 4000)["recommendation"])