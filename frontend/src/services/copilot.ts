import { askGuide, type GuideResult } from '@/services/guide';
import type { Vehicle, Shipment } from '@/types';

export type CopilotPayloadType =
  | 'text'
  | 'guide'
  | 'fleet_status'
  | 'health_alert'
  | 'shipment_summary'
  | 'forecast_summary'
  | 'calculator'
  | 'action_result';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  type: CopilotPayloadType;
  title?: string;
  text?: string;
  guide?: GuideResult;
  data?: any;
  action?: {
    label: string;
    to?: string;
    handler?: () => void;
  };
}

export interface CopilotContext {
  vehicles: Vehicle[];
  shipments: Shipment[];
  demoMode: boolean;
  presentationMode: boolean;
  toggleDemoMode: () => void;
  togglePresentationMode: () => void;
  selectVehicle: (id: string) => void;
  navigate: (to: string) => void;
}

/** Compute real-time fleet health and warnings. */
export function analyzeFleetHealth(vehicles: Vehicle[]) {
  const atRisk = vehicles.filter((v) => {
    const kmSinceService = v.currentOdometerKm - v.lastMaintenanceKm;
    const isOverdue = kmSinceService >= v.maintenanceIntervalKm;
    const isLowHealth = (v.healthScore ?? 100) < 75;
    return isOverdue || isLowHealth;
  });

  const avgHealth = vehicles.length
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.healthScore ?? 85), 0) / vehicles.length)
    : 100;

  return { atRisk, avgHealth };
}

/** Compute fleet statistics. */
export function analyzeFleet(vehicles: Vehicle[]) {
  const total = vehicles.length;
  const available = vehicles.filter((v) => v.available).length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance' || !v.available).length;
  const inTransit = vehicles.filter((v) => v.status === 'in-transit').length;

  const typeCounts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { total, available, maintenance, inTransit, typeCounts };
}

/** Compute shipment operations statistics. */
export function analyzeShipments(shipments: Shipment[]) {
  const total = shipments.length;
  const planned = shipments.filter((s) => s.status === 'planned').length;
  const inTransit = shipments.filter((s) => s.status === 'in-transit').length;
  const delivered = shipments.filter((s) => s.status === 'delivered').length;
  const active = planned + inTransit;

  return { total, planned, inTransit, delivered, active, recent: shipments.slice(0, 4) };
}

/** Quick logistics estimate for custom distance and cargo weight. */
export function estimateLogistics(distanceKm: number, weightKg: number) {
  // Typical diesel commercial mileage ~ 5 to 12 km/l depending on weight
  const baseMileage = weightKg > 5000 ? 5.2 : weightKg > 2000 ? 8.5 : 12.0;
  const fuelL = Math.max(1, distanceKm / baseMileage);
  const fuelPricePerL = 90.5; // Average Indian diesel price in INR
  const costEstimate = Math.round(fuelL * fuelPricePerL + distanceKm * 14); // Fuel + operational overhead
  const co2Kg = Math.round(fuelL * 2.68); // 2.68 kg CO2 per litre of diesel

  let recommendedType = 'Delivery Van';
  if (weightKg > 8000) recommendedType = 'Heavy Truck';
  else if (weightKg > 3500) recommendedType = 'Mini Truck';
  else if (weightKg > 1500) recommendedType = 'Tempo';

  return {
    distanceKm,
    weightKg,
    fuelL: Math.round(fuelL * 10) / 10,
    costEstimate,
    co2Kg,
    recommendedType,
  };
}

/**
 * Intelligent natural language intent handler that interacts with live state.
 */
export function processCopilotQuery(
  rawInput: string,
  context: CopilotContext,
): Omit<CopilotMessage, 'id' | 'role'> {
  const q = rawInput.toLowerCase().trim();

  // 1. Fleet status query
  if (
    q.includes('fleet status') ||
    q.includes('how many vehicle') ||
    q.includes('how many truck') ||
    q.includes('fleet summary') ||
    q.includes('truck status') ||
    q.includes('available truck') ||
    q.includes('available vehicle') ||
    q === 'fleet'
  ) {
    const stats = analyzeFleet(context.vehicles);
    return {
      type: 'fleet_status',
      title: 'Real-Time Fleet Overview',
      text: `Your fleet currently has ${stats.total} total vehicles. ${stats.available} are available for dispatch, ${stats.inTransit} in-transit, and ${stats.maintenance} in maintenance or unavailable.`,
      data: stats,
      action: {
        label: 'Open Fleet Management',
        to: '/fleet',
      },
    };
  }

  // 2. Health & Maintenance alert query
  if (
    q.includes('health') ||
    q.includes('maintenance') ||
    q.includes('service due') ||
    q.includes('breakdown') ||
    q.includes('risk') ||
    q.includes('repair') ||
    q.includes('inspection')
  ) {
    const { atRisk, avgHealth } = analyzeFleetHealth(context.vehicles);
    return {
      type: 'health_alert',
      title: 'Predictive Fleet Health & Service Alerts',
      text: atRisk.length > 0
        ? `Identified ${atRisk.length} vehicle(s) needing attention due to high failure risk or overdue service intervals. Fleet health averages ${avgHealth}%.`
        : `All ${context.vehicles.length} vehicles are currently in good operating health! Fleet health average is ${avgHealth}%.`,
      data: { atRisk, avgHealth },
      action: {
        label: 'Inspect in AI Analytics',
        to: '/ai/demand',
      },
    };
  }

  // 3. Shipment / Orders status query
  if (
    q.includes('shipment') ||
    q.includes('order') ||
    q.includes('delivery') ||
    q.includes('deliveries') ||
    q.includes('in-transit') ||
    q.includes('in transit') ||
    q.includes('tracking')
  ) {
    const stats = analyzeShipments(context.shipments);
    return {
      type: 'shipment_summary',
      title: 'Active Shipments & Logistics Board',
      text: `Managing ${stats.total} total shipments: ${stats.active} active orders (${stats.inTransit} in-transit, ${stats.planned} planned), and ${stats.delivered} delivered successfully.`,
      data: stats,
      action: {
        label: 'Open Shipments Board',
        to: '/shipments',
      },
    };
  }

  // 4. Demand forecast query
  if (
    q.includes('forecast') ||
    q.includes('demand') ||
    q.includes('predict') ||
    q.includes('next week') ||
    q.includes('volume') ||
    q.includes('peak')
  ) {
    return {
      type: 'forecast_summary',
      title: '14-Day AI Demand Projection',
      text: 'The Gradient-Boosted regression model predicts shipping demand over the next 14 days with 95% confidence intervals, highlighting peak volume days and recommended fleet readiness.',
      data: {
        recommendedFleet: Math.max(8, Math.ceil(context.vehicles.length * 0.85)),
        horizonDays: 14,
      },
      action: {
        label: 'View Full Demand Analytics',
        to: '/ai/demand',
      },
    };
  }

  // 5. Calculator / Cost / Fuel Estimator query
  if (
    q.includes('calculate') ||
    q.includes('calculator') ||
    q.includes('estimate') ||
    q.includes('cost to') ||
    q.includes('fuel for') ||
    q.includes('how much fuel') ||
    q.includes('how much cost') ||
    q.includes('co2 for') ||
    q.includes('carbon for')
  ) {
    // Try to parse numbers from query (e.g. "estimate 350 km and 4000 kg")
    const numbers = q.match(/\d+(\.\d+)?/g);
    let dist = 350;
    let weight = 4000;
    if (numbers && numbers.length >= 1) dist = parseFloat(numbers[0]);
    if (numbers && numbers.length >= 2) weight = parseFloat(numbers[1]);

    const result = estimateLogistics(dist, weight);
    return {
      type: 'calculator',
      title: 'Quick Route Economics Calculator',
      text: `Interactive estimate for ${dist} km route carrying ${weight} kg cargo:`,
      data: result,
      action: {
        label: 'Open Route Optimizer',
        to: '/routes',
      },
    };
  }

  // 6. Direct Actions: Demo Mode
  if (q.includes('demo mode') || q.includes('sample data') || q.includes('load demo') || q.includes('toggle demo')) {
    context.toggleDemoMode();
    const newState = !context.demoMode;
    return {
      type: 'action_result',
      title: 'Demo Mode Toggled',
      text: newState
        ? 'Demo Mode has been turned ON. Loaded 14 realistic commercial vehicles and 22 active shipments.'
        : 'Demo Mode has been turned OFF. The system is operating in standard mode.',
      action: {
        label: 'View Dashboard',
        to: '/dashboard',
      },
    };
  }

  // 7. Direct Actions: Presentation Mode
  if (q.includes('presentation') || q.includes('present') || q.includes('projector') || q.includes('full screen')) {
    context.togglePresentationMode();
    return {
      type: 'action_result',
      title: 'Presentation Mode Triggered',
      text: 'Switched to clean fullscreen Presentation Mode for high-level stakeholder reviews and projector demos.',
      action: {
        label: 'Open Settings',
        to: '/settings',
      },
    };
  }

  // 8. Direct Navigation shortcuts
  if (q.startsWith('go to') || q.startsWith('open') || q.startsWith('take me to') || q.startsWith('navigate to')) {
    if (q.includes('fleet')) {
      return {
        type: 'action_result',
        title: 'Navigating to Fleet Management',
        text: 'Opening Fleet Management where you can configure 3D models and customize specifications.',
        action: { label: 'Go to Fleet', to: '/fleet' },
      };
    }
    if (q.includes('route') || q.includes('optimizer') || q.includes('map')) {
      return {
        type: 'action_result',
        title: 'Navigating to Route Optimizer',
        text: 'Opening real-road Route Optimizer with OSM road geometry and AI vehicle recommendations.',
        action: { label: 'Go to Routes', to: '/routes' },
      };
    }
    if (q.includes('shipment') || q.includes('order')) {
      return {
        type: 'action_result',
        title: 'Navigating to Shipments',
        text: 'Opening Shipments Board to view live statuses and dispatch orders.',
        action: { label: 'Go to Shipments', to: '/shipments' },
      };
    }
    if (q.includes('ai') || q.includes('demand') || q.includes('analytic')) {
      return {
        type: 'action_result',
        title: 'Navigating to AI Analytics',
        text: 'Opening Demand Forecasts and Model Registry.',
        action: { label: 'Go to AI Analytics', to: '/ai/demand' },
      };
    }
    if (q.includes('sustain') || q.includes('green') || q.includes('eco') || q.includes('carbon')) {
      return {
        type: 'action_result',
        title: 'Navigating to Sustainability',
        text: 'Opening Green Logistics and CO2 Assessment module.',
        action: { label: 'Go to Sustainability', to: '/ai/sustainability' },
      };
    }
    if (q.includes('setting')) {
      return {
        type: 'action_result',
        title: 'Navigating to Settings',
        text: 'Opening System Configuration and Data Persistence controls.',
        action: { label: 'Go to Settings', to: '/settings' },
      };
    }
    if (q.includes('dashboard') || q.includes('home')) {
      return {
        type: 'action_result',
        title: 'Navigating to Dashboard',
        text: 'Opening Fleet Command Center Overview.',
        action: { label: 'Go to Dashboard', to: '/dashboard' },
      };
    }
  }

  // 9. Standard How-to Guide matcher
  const guideResult = askGuide(rawInput);
  if (guideResult) {
    return {
      type: 'guide',
      guide: guideResult,
    };
  }

  // 10. Fallback with helpful smart recommendations
  return {
    type: 'text',
    title: 'How can I assist you?',
    text: "I can help you monitor live fleet stats, identify vehicles needing maintenance, track shipments, calculate route costs/CO₂, or guide you through any Lumina feature. Try tapping one of the quick actions below!",
  };
}
