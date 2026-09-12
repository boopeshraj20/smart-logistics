# Project Documentation

## Architecture decisions

### Database adapter pattern (`frontend/src/services/db.ts`)
- Primary store is **Cloud Firestore** (project `smart-logistic-18f97`), document `state/snapshot`.
- On any Firestore error (offline, security rules blocking) it falls back to a localStorage mock,
  so presentations never break.
- Without Firebase credentials the local adapter is used directly and the product runs fully offline.

> Firestore setup: in the Firebase console → Firestore Database → Create database, then set rules to
> allow read/write for the demo (tighten before any real deployment):
> ```
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} { allow read, write: if true; }
>   }
> }
> ```

### Real road routing (`OpenRouteService`)
- Backend calls `api.openrouteservice.org/v2/directions/{profile}` with the configured key.
- Profiles: `driving-hgv` for heavy vehicles, `driving-car` for vans. Phoenix compares routes,
  distance and duration from actual OSM road geometry (never straight-line).
- The backend is the single owner of the ORS key; the frontend key is used for on-map interactive
  routing previews (Phase 4).

### Environment configuration
- Backend: `backend/.env` consumed by pydantic-settings (`app/core/config.py`).
- Frontend: `frontend/.env` consumed by Vite (`import.meta.env`), centralized in `services/config.ts`.

## API surface (evolving)

| Method | Path                          | Purpose                                   |
| ------ | ----------------------------- | ----------------------------------------- |
| GET    | `/api/v1/system/health`       | Liveness probe                            |
| GET    | `/api/v1/meta`                | Module metadata                           |
| POST   | `/api/v1/routes/optimize`     | (Phase 4) real-road route                 |
| POST   | `/api/v1/assign/plan`         | (Phase 5) adaptive vehicle assignment     |
| GET    | `/api/v1/models`              | (Phase 6) trained ML model registry       |
| POST   | `/api/v1/train`               | (Phase 6) retrain + persist all models    |
| GET    | `/api/v1/forecast/demand`     | (Phase 6) demand forecasting              |
| POST   | `/api/v1/maintenance/predict` | (Phase 6) predictive maintenance          |
| POST   | `/api/v1/assign/recommend`    | (Phase 6) AI vehicle assignment           |
| POST   | `/api/v1/eco/assess`          | (Phase 6) green logistics assessment      |

## Phase 6 — AI Intelligence Layer

- **No hardware/IoT.** Models train on deterministic seeded generators
  (`backend/app/ml/datasets.py`) that replicate the signal patterns of public datasets
  (weekday/festival/monsoon demand seasonality, EPA-style fuel curves, fleet logbook stats).
- **Algorithms (scikit-learn, joblib persistence).**
  - Demand forecast: `GradientBoostingRegressor` on 7 engineered time features
    (`R² 0.75`), recursive 1-step 14-day projection with 95% band.
  - Health score: `Ridge` (`R² 0.82`); service-earning: `ElasticNet` (`R² ~1.0`).
  - Assignment utility: `LinearRegression` on cost/efficiency/availability/health/capacity
    (`R² 0.91`); hard feasibility penalty ×0.1 when capacity or availability fails.
  - Fuel litres: `Ridge` on distance/weight/load-ratio/type/mileage (`R² 0.87`).
- **Explainability contract:** every prediction returns `confidence` (0–1), `summary`,
  `bullets`, and per-feature `factors` (feature/value/contribution/direction/note).
- Artifacts persist to `backend/app/ml/artifacts/` (joblib + `registry.json`); first request
  lazy-trains if missing. Frontend consumes them via `frontend/src/services/ai.ts` with
  deterministic client-side fallbacks so the UI never breaks when the backend is down.

## Conventions

- TypeScript strict mode; path aliases `@/`, `@components/`, `@services/`, etc. (`vite.config.ts` / `tsconfig.app.json`).
- Backend: FastAPI routers under `app/api/v1`, business logic in `app/services`, ML in `app/ml`.
- No comments in code unless they document rationale (per project style).
- Commits: only when explicitly requested.