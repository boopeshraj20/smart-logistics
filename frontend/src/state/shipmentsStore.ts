import { create } from 'zustand';

import { type ID, type Shipment } from '@/types';

/**
 * Seed shipments — let fleet analytics be meaningful the moment Phase 5 boots.
 * These mirror the route-builder semantics (weight + economics on each shipment).
 */
export const SEED_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-1001',
    reference: 'SH-92XJ',
    pickup: { id: 'loc-chennai', name: 'Chennai Goods Terminal', city: 'Tamil Nadu', location: { lat: 13.0827, lng: 80.2707 } },
    stops: [],
    destination: { id: 'loc-bangalore', name: 'Bangalore Distribution Centre', city: 'Karnataka', location: { lat: 12.9716, lng: 77.5946 } },
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    status: 'in-transit',
    weightKg: 5000,
    costEstimate: 9520,
    assignedVehicleId: 'veh-003',
    route: {
      distanceKm: 340,
      durationMin: 420,
      geometry: [],
      steps: [],
      fuelEstimateL: 45.3,
      costEstimate: 9520,
      co2EstimateKg: 121,
      provider: 'ors',
    },
  },
  {
    id: 'shp-1002',
    reference: 'SH-51KP',
    pickup: { id: 'loc-bangalore', name: 'Bangalore Distribution Centre', city: 'Karnataka', location: { lat: 12.9716, lng: 77.5946 } },
    stops: [],
    destination: { id: 'loc-hyderabad', name: 'Hyderabad Fulfilment Hub', city: 'Telangana', location: { lat: 17.385, lng: 78.4867 } },
    createdAt: new Date(Date.now() - 74 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    weightKg: 10000,
    costEstimate: 24240,
    assignedVehicleId: 'veh-001',
    route: {
      distanceKm: 570,
      durationMin: 690,
      geometry: [],
      steps: [],
      fuelEstimateL: 114,
      costEstimate: 24240,
      co2EstimateKg: 305,
      provider: 'ors',
    },
  },
  {
    id: 'shp-1003',
    reference: 'SH-03TL',
    pickup: { id: 'loc-kochi', name: 'Kochi Metro Depot', city: 'Kerala', location: { lat: 9.9312, lng: 76.2673 } },
    stops: [],
    destination: { id: 'loc-coimbatore', name: 'Coimbatore Warehouse', city: 'Tamil Nadu', location: { lat: 11.0168, lng: 76.9558 } },
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    status: 'planned',
    weightKg: 1200,
    costEstimate: 5202,
    assignedVehicleId: 'veh-005',
    route: {
      distanceKm: 289,
      durationMin: 380,
      geometry: [],
      steps: [],
      fuelEstimateL: 24,
      costEstimate: 5202,
      co2EstimateKg: 64,
      provider: 'ors',
    },
  },
];

interface ShipmentsState {
  shipments: Shipment[];
  addShipment: (shipment: Shipment) => void;
  setShipments: (shipments: Shipment[]) => void;
  updateStatus: (id: ID, status: Shipment['status']) => void;
}

export const useShipmentsStore = create<ShipmentsState>((set) => ({
  shipments: SEED_SHIPMENTS,
  addShipment: (shipment) => set((s) => ({ shipments: [shipment, ...s.shipments] })),
  setShipments: (shipments) => set({ shipments }),
  updateStatus: (id, status) =>
    set((s) => ({
      shipments: s.shipments.map((x) => (x.id === id ? { ...x, status } : x)),
    })),
}));

/** Generate a short human-friendly reference, e.g. SH-7F3K. */
export function nextReference(existing: Shipment[], id: ID): string {
  const taken = new Set(existing.map((s) => s.reference));
  const suffix = id.replace(/\D/g, '').slice(-4).toUpperCase().padStart(4, '0');
  let ref = `SH-${suffix}`;
  while (taken.has(ref)) {
    ref = `SH-${suffix}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }
  return ref;
}