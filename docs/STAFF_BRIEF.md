# Staff Brief — AI-Powered Smart Logistics Management System

Use this to explain the project to faculty/staff. It covers the problem, the
solution, the ML/AI technology actually used, the recommended live demo order,
and the four features to make sure the audience understands.

---

## 1. The Problem

Transport SMEs run fleets blind on three things:

- **Demand** — no idea what volume is coming, so they either over-dispatch
  (wasted cost) or under-dispatch (missed orders).
- **Vehicle health** — breakdowns happen because nobody sees a truck getting
  close to its service window or failing.
- **Vehicle choice** — when a shipment comes in, picking the cheapest truck
  that actually fits the load is guesswork, and nobody tracks fuel/CO2 per trip.

Add to that: routes planned by straight-line intuition (costly, wrong), and
decisions that can't be justified when management asks "why that truck?"

## 2. The Solution

A web-based **AI-Powered Smart Logistics Management System** — one React
dashboard, one Python/FastAPI backend. Every business question maps to a module:

| Business question | Module |
|---|---|
| "What's the state of the fleet right now?" | Live dashboard: active vehicles, on-time %, fuel, CO2, health |
| "How much demand is coming, and how many vehicles do I need?" | AI demand forecast (next 14 days) + fleet-size recommendation |
| "Which trucks are about to break or need service?" | Predictive maintenance: health score 0-100, next-service km, failure risk |
| "Which vehicle should take this shipment?" | AI vehicle assignment - ML ranking with reasons |
| "Which option is cheapest / greenest?" | Eco assessment: fuel litres, kg CO2, cost, sustainability score |
| "What's the best real drive, not a straight line?" | Real-road routing via OpenRouteService (OSM road network) |

Every AI answer comes with **confidence (0-1)** and **plain-English reasons** -
nothing is a black box.

## 3. ML / AI Technology Actually Used

- **Scikit-learn**, models persisted as `.joblib` artifacts, retrainable live
  via a Train endpoint.
- **Demand forecast** - `GradientBoostingRegressor` on 7 engineered time
  features (weekday, weekend, festival, monsoon season, 7-day lag and rolling
  average). Chronological hold-out evaluation (no future leakage). R2 **0.75**,
  recursive 1-step 14-day projection with a 95% band.
- **Vehicle health** - Ridge regression, R2 **0.82**; **next-service km** -
  ElasticNet, R2 ~**1.0**.
- **Assignment utility** - Linear regression over cost/km, CO2/km, mileage,
  availability, capacity fit, health. R2 **0.91**, hard feasibility penalty
  when capacity or availability fails.
- **Fuel (litres)** - Ridge on distance, weight, load ratio, vehicle type,
  mileage. R2 **0.87**. CO2 = litres x 2.68 kg/L (diesel).
- **Training data** - deterministic seeded generators (730 daily demand
  records, 120 service logs, 2,400 assignment decisions, 3,000 waybills) that
  replicate real-world patterns: weekday/festival/monsoon seasonality, EPA-style
  fuel curves.
- **Explainability contract** - every prediction returns confidence, summary,
  bullets, and per-feature factors (value / contribution / direction / note).

## 4. Recommended Demo Order (what to show)

1. **Dashboard** - the story in one screen: delivery trend chart, fleet status
   donut, fuel efficiency, carbon emissions. Keep it simple here.
2. **Fleet page** - vehicle cards, the 3D vehicle configurator, edit/live-edit
   vehicles; point out the AI assignment lens.
3. **Routes** - type a location (real geocoding), watch it produce an actual
   road route with distance/duration, then reorder stops.
4. **AI Insights** - the killer screen. Show the demand forecast chart and
   Recommended fleet size, then the Model Registry table (R2/confidence per
   model), and hit **Retrain** live.
5. **Sustainability** - pick a route and watch the system rank vehicles by
   fuel, CO2, cost, and a 0-100 sustainability score with savings vs. an
   all-heavy-truck baseline.
6. **Assignment plan** - one demo shipment to ranked trucks, each with reasons
   and cost/CO2/ETA estimates.
7. **Presentation mode** - fullscreen auto-advancing slideshow, great for a
   room.

## 5. The 4 Features Staff Must Understand

1. **Explainable AI** - it doesn't just say "use truck #7"; it says why: score,
   driving factors, confidence. That makes decisions defensible in operations.
2. **Fleet-size recommendation** - the forecast literally tells you how many
   vehicles to dispatch on the peak day (peak orders / ~10 per vehicle-day).
3. **Predictive maintenance** - a truck past ~85% of its service interval or
   with health < 60 is flagged before it breaks; failure risk is quantified.
4. **Resilience** - live OpenRouteService routing with offline demo fallback;
   the whole app can run fully offline for demos.

---

# 4-Slide Speaking Script

## Slide 1 - The Problem
> "Fleet operators decide with gut feeling. They don't know tomorrow's demand,
> they don't know which truck is about to break, and when a shipment arrives
> they pick a truck by habit, not by cost or CO2. Routes are drawn as straight
> lines even when the real road isn't one."

## Slide 2 - What the System Does
> "One dashboard, one backend. It forecasts demand for the next 14 days and
> says exactly how many vehicles to dispatch. It watches every truck's health
> and flags the one heading for a breakdown. When a shipment needs a driver, it
> ranks the whole fleet by cost, capacity, efficiency and health - and tells
> you why. And it optimizes real road routes, not straight lines."

## Slide 3 - The AI Behind It (keep to ~1 minute)
> "All models are scikit-learn. Demand uses gradient boosting on time features
> like weekday, festival and monsoon seasonality - R2 0.75. Health uses Ridge,
> service interval ElasticNet, fuel Ridge, and assignment a linear model with R2
> 0.91. Every model learns from generated data that reproduces real logistics
> patterns, and every prediction comes with a confidence score and human-readable
> reasons. No black boxes."

## Slide 4 - What Makes It Ready for the Real World
> "Three things. Explainability - every recommendation justifies itself.
> Predictive maintenance - we catch failures before they happen. And resilience -
> real road routing on OpenStreetMap data, with a full offline demo fallback so
> a presentation never fails."