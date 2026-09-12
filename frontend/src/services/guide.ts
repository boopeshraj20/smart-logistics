/**
 * In-app User Guide.
 *
 * The assistant ONLY answers how-to-use questions about Lumina. Queries are
 * scored against a curated topic index; anything out of scope gets a polite
 * redirect with suggested topics instead of a fabricated answer.
 */

export interface GuideTopic {
  id: string;
  section: string;
  question: string;
  keywords: string[];
  answer: string;
  /** Optional deep-link shown as an action chip. */
  link?: { to: string; label: string };
}

export interface GuideResult {
  topic: GuideTopic;
  matched: string[] | null;
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'add-vehicle',
    section: 'Fleet',
    question: 'How do I add a vehicle?',
    keywords: ['add vehicle', 'new vehicle', 'create vehicle', 'register vehicle', 'add truck', 'new truck'],
    answer:
      'Open Fleet Management and click the "+ Add vehicle" button on the Fleet Showcase panel. Choose a vehicle class (Heavy Truck, Mini Truck, Tempo or Delivery Van) — Lumina pre-fills the class spec (capacity, fuel, mileage, service interval). Give it a name and plate number, pick a body colour in the 3D configurator, then Save. The vehicle appears in your fleet instantly.',
    link: { to: '/fleet', label: 'Open Fleet' },
  },
  {
    id: 'edit-vehicle',
    section: 'Fleet',
    question: 'How do I customise a vehicle?',
    keywords: ['edit vehicle', 'customise vehicle', 'customize vehicle', 'change color', 'vehicle color', 'edit truck', 'change mileage'],
    answer:
      'Select the vehicle in Fleet Management to open the inspector, then click "Edit". The configurator lets you change the class spec (capacity, mileage, cost/km, fuel type, service interval), the body colour (live 3D preview) and availability. Press Save — every downstream estimate (cost, CO₂, assignment scoring) recomputes against the updated profile.',
    link: { to: '/fleet', label: 'Open Fleet' },
  },
  {
    id: 'create-shipment',
    section: 'Shipments',
    question: 'How do I create a shipment?',
    keywords: ['create shipment', 'new shipment', 'add shipment', 'make shipment', 'plan shipment'],
    answer:
      'Shipments are created from the Route Optimizer. Add a start location, optional stops, and a destination (type a city or click the map). Set the load weight and vehicle class, then press "Optimize Route". Review the road distance, time, fuel and CO₂, then click "Save shipment" — it is added to the Shipments board as a planned order.',
    link: { to: '/routes', label: 'Open Route Optimizer' },
  },
  {
    id: 'track-shipments',
    section: 'Shipments',
    question: 'How do I track shipments?',
    keywords: ['track shipment', 'shipment status', 'shipments list', 'view shipments', 'shipment board'],
    answer:
      'The Shipments board lists every order with status (planned, assigned, in-transit, delivered, delayed, cancelled). Use the filter tabs and the search bar (top of the screen) to narrow the list. Open a row to expand the route detail; planned/in-transit orders can be marked delivered or cancelled directly from the board.',
    link: { to: '/shipments', label: 'Open Shipments' },
  },
  {
    id: 'route-optimization',
    section: 'Routing',
    question: 'How does route optimization work?',
    keywords: ['route optimization', 'how does routing work', 'optimize route', 'road routing', 'best route'],
    answer:
      'Lumina fetches real road geometry and distance from OpenRouteService (OSM data) for the heavy or light profile, then ranks your own fleet on cost, fuel economy, availability, health and capacity fit to pick the best vehicle (the ML assignment model). If the routing service is unreachable it gracefully falls back to a straight-line estimate and tells you so — the app never breaks.',
    link: { to: '/routes', label: 'Open Route Optimizer' },
  },
  {
    id: 'demand-forecast',
    section: 'AI',
    question: 'How do I see demand forecasts?',
    keywords: ['demand forecast', 'ai forecast', 'forecasting', 'peak demand', 'predict shipments', 'demand prediction'],
    answer:
      'Open AI Analytics → the Demand Forecast panel shows the next 14 days projected by a gradient-boosting model, with a 95% confidence band, the busiest day, peak load and a recommended fleet size. The "Why the model says so" panel lists the top contributing features and confidence, so every forecast is explainable.',
    link: { to: '/ai/demand', label: 'Open AI Analytics' },
  },
  {
    id: 'maintenance',
    section: 'AI',
    question: 'How does predictive maintenance work?',
    keywords: ['predictive maintenance', 'vehicle health', 'maintenance predict', 'health score', 'service due', 'when to service'],
    answer:
      'The AI layer predicts each vehicle’s health score (0–100), remaining km until service and failure risk from its odometer, service interval, age and utilisation. See the Fleet Health table on the dashboard and AI Analytics. Vehicles under 70 health or overdue for service show as warnings with a recommended action.',
    link: { to: '/ai/demand', label: 'Open AI Analytics' },
  },
  {
    id: 'sustainability',
    section: 'AI',
    question: 'How do I measure sustainability?',
    keywords: ['sustainability', 'co2', 'carbon', 'green logistics', 'eco', 'emissions', 'fuel efficiency', 'carbon footprint'],
    answer:
      'Open Sustainability. Enter a route distance and cargo weight, then press "Run assessment". Lumina ranks every candidate vehicle on fuel, CO₂ (at 2.68 kg per litre burned) and cost, shows a sustainability score (0–100), the CO₂ saved versus a heavy-truck baseline, and explains the ranking. The dashboard carbon chart shows the same modelling across the fleet.',
    link: { to: '/ai/sustainability', label: 'Open Sustainability' },
  },
  {
    id: 'assignment',
    section: 'AI',
    question: 'How does AI vehicle assignment work?',
    keywords: ['assignment', 'assign vehicle', 'which vehicle', 'best vehicle', 'vehicle recommendation', 'pick vehicle'],
    answer:
      'When you optimize a route, the AI assignment model scores every candidate vehicle on operating cost, fuel efficiency, CO₂ per km, availability, health and capacity fit, then applies a hard penalty if a vehicle can’t carry the load or isn’t available. The recommended truck plus runner-up ranks appear in the results panel with human-readable reasons. The same scorer powers the offline fallback.',
    link: { to: '/routes', label: 'Open Route Optimizer' },
  },
  {
    id: 'ai-assignment-advisor',
    section: 'Fleet',
    question: 'What is the AI assignment advisor?',
    keywords: ['ai assignment advisor', 'advisor', 'assign advisor', 'active load', 'fleet advisor'],
    answer:
      'On Fleet Management, the AI Assignment Advisor watches your active (non-delivered) shipments and suggests which vehicles to pre-assign, ranked by cost and efficiency using your current load books.',
    link: { to: '/fleet', label: 'Open Fleet' },
  },
  {
    id: '3d-viewer',
    section: 'Fleet',
    question: 'How do I use the 3D viewer?',
    keywords: ['3d viewer', '3d model', 'three.js', 'rotate vehicle', '3d vehicle', 'inspect vehicle 3d'],
    answer:
      'Every vehicle renders as an interactive Three.js model — drag to rotate, and the turntable auto-rotates until you hover. Body colour reflects your chosen swatch. The dashboard 3D showpiece and the configurator use the same scene, so what you pick is what you see.',
  },
  {
    id: 'demo-mode',
    section: 'Settings',
    question: 'How do I use Demo Mode?',
    keywords: ['demo mode', 'sample data', 'demo data', 'load demo', 'demonstration', 'demo dataset'],
    answer:
      'Demo Mode loads a realistic fleet of 14 vehicles and 22 shipments across the last nine days so every section has meaningful data. Toggle it in the top bar (Demo switch) or in Settings → "Load demo dataset". "Reset to seed" restores the compact starter fleet.',
    link: { to: '/settings', label: 'Open Settings' },
  },
  {
    id: 'presentation-mode',
    section: 'Settings',
    question: 'How do I use Presentation Mode?',
    keywords: ['presentation mode', 'present', 'projector', 'fullscreen', 'kpi dashboard', 'deploy demo'],
    answer:
      'Settings → "Presentation Mode" (or the top-bar Deploy control) switches to a clean fullscreen KPI dashboard that auto-advances through key metrics, the demand forecast, fleet health and sustainability — ideal for a projector. Press Esc or the Exit button to return to the workbench.',
    link: { to: '/settings', label: 'Open Settings' },
  },
  {
    id: 'settings',
    section: 'Settings',
    question: 'What is on the Settings page?',
    keywords: ['settings', 'preferences', 'store', 'firebase', 'persistence', 'where is settings'],
    answer:
      'Settings shows environment info (Firebase Firestore vs local storage adapter), Demo Mode controls, Presentation Mode, the AI endpoint status, and the User Guide. Everything on Settings reflects immediately.',
    link: { to: '/settings', label: 'Open Settings' },
  },
  {
    id: 'data-persistence',
    section: 'Settings',
    question: 'Where is my data stored?',
    keywords: ['data stored', 'persistence', 'local storage', 'firestore', 'save data', 'sync', 'backup'],
    answer:
      'Lumina writes your fleet and shipment snapshots to Cloud Firestore when Firebase credentials are configured, and automatically falls back to local browser storage if offline. Both are restored on next launch. The Settings page reports which adapter is active.',
    link: { to: '/settings', label: 'Open Settings' },
  },
  {
    id: 'dashboard',
    section: 'Overview',
    question: 'What is on the dashboard?',
    keywords: ['dashboard', 'overview', 'kpi', 'command center', 'what does dashboard show', 'main page'],
    answer:
      'The Fleet Command Center is the live overview: fleet/available/shipment KPIs, the ML demand forecast chart, fleet health, carbon & fuel analytics, a live map showing the latest corridor, AI insights generated from your data, and a 3D fleet showpiece.',
    link: { to: '/dashboard', label: 'Open Dashboard' },
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Answer an in-app how-to question.
 * Returns null (no result) only when nothing remotely matches — the caller
 * renders the out-of-scope fallback.
 */
export function askGuide(rawQuestion: string): GuideResult | null {
  const query = normalize(rawQuestion);
  if (!query) return null;

  let best: GuideResult | null = null;
  let bestScore = 0;

  for (const topic of GUIDE_TOPICS) {
    const matched: string[] = [];
    let score = 0;
    for (const keyword of topic.keywords) {
      const kw = normalize(keyword);
      if (query === kw) {
        score += 5;
        matched.push(keyword);
      } else if (query.includes(kw)) {
        score += kw.split(' ').length;
        matched.push(keyword);
      } else if (kw.includes(query) && query.length >= 4) {
        score += 1.5;
        matched.push(keyword);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = { topic, matched: matched.length > 0 ? matched : null };
    }
  }

  // Threshold: require a meaningful keyword match, not random words.
  if (!best || bestScore < 2) return null;
  return best;
}

/** Short list shown as quick-pick chips in the guide. */
export function suggestedQuestions(): GuideTopic[] {
  return [
    GUIDE_TOPICS.find((t) => t.id === 'add-vehicle')!,
    GUIDE_TOPICS.find((t) => t.id === 'create-shipment')!,
    GUIDE_TOPICS.find((t) => t.id === 'route-optimization')!,
    GUIDE_TOPICS.find((t) => t.id === 'demand-forecast')!,
    GUIDE_TOPICS.find((t) => t.id === 'presentation-mode')!,
  ];
}

export const GUIDE_SCOPE_NOTE =
  'I only answer how-to questions about Lumina — adding vehicles, creating shipments, routing, AI forecasts, sustainability, demo and presentation mode.';