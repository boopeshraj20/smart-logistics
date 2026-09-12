# Lumina — AI-Powered Smart Logistics Management System

A presentation-ready, software-only logistics platform: real road routing, AI fleet
optimization, predictive maintenance and green logistics — with a premium enterprise UI.

## Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4, Three.js   |
| Maps      | Leaflet + OpenStreetMap, OpenRouteService (real roads) |
| Backend   | Python, FastAPI                                        |
| Database  | Firebase (Cloud Firestore) + localStorage fallback    |
| AI/ML     | Scikit-learn, pandas, numpy                           |

## Folder layout

```
smart-logistics/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/   # AppShell + reusable UI
│   │   ├── features/     # Feature-scoped modules
│   │   ├── pages/        # Route pages
│   │   ├── services/     # config, firebase, db adapters
│   │   ├── state/        # Zustand stores
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # api client + utils
│   │   └── types/        # Domain models
│   └── .env.example
├── backend/           # FastAPI service
│   └── app/
│       ├── core/          # settings
│       ├── api/v1/        # REST routes
│       ├── schemas/       # Pydantic models
│       ├── services/      # routing + business logic
│       ├── ml/            # scikit-learn models
│       └── data/          # datasets + seeds
└── docs/
```

## Run locally

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in keys
npm run dev            # http://localhost:5173
```

### Backend

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill ORS key
uvicorn app.main:app --reload --port 8000
# Interactive API docs: http://localhost:8000/docs
```

## Deploy

Deploy the frontend and backend as separate services:

1. **Backend:** create a Web Service on Render (or Railway) from the repository.
  Set the root directory to `backend`, build command to `pip install -r requirements.txt`,
  and start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
2. Add the backend environment variables from `backend/.env.example`, including
  `ORS_API_KEY` and `CORS_ORIGINS=["https://YOUR-APP.vercel.app"]`.
3. **Frontend:** import the same repository into Vercel and set the root directory to
  `frontend`. Vercel detects Vite automatically; the included `frontend/vercel.json`
  keeps client-side routes working after refresh.
4. In Vercel project settings, add `VITE_API_BASE` with the deployed backend URL plus
  `/api`, for example `https://YOUR-BACKEND.onrender.com/api`, then redeploy.
5. Add the remaining `VITE_*` values from `frontend/.env.example` in Vercel.

The backend must be deployed before the frontend so its public URL can be used in
`VITE_API_BASE`. Do not commit `.env` files or paste secret keys into source code.

## Credentials

- **OpenRouteService key** → `backend/.env` (`ORS_API_KEY`) and `frontend/.env` (`VITE_ORS_API_KEY`)
- **Firebase (Cloud Firestore)** → `frontend/.env` (`VITE_FIREBASE_*`). Project: `smart-logistic-18f97`.
  Enable Firestore in the console and allow read/write for the demo. The app falls back to a local
  mock if Firestore is unreachable.

## Phase roadmap

1. ✅ Architecture & scaffolding
2. ✅ Design system & dashboard UI
3. ✅ Three.js vehicle visualization (procedural models, fleet showcase, 3D preview)
4. Maps & real-road routing
5. AI Adaptive Fleet Personalization
6. Shipment management & tracking
7. AI modules (forecasting, assignment, maintenance, sustainability)
8. Firebase integration (seeding + adapter hardening)
9. Final polish + presentation/demo mode
