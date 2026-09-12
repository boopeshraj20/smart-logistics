import { create } from 'zustand';

import { type ID, type Vehicle } from '@/types';
import { FLEET_SEED } from '@/features/fleet/data';
import { db } from '@/services/db';
import { useShipmentsStore } from '@/state/shipmentsStore';

interface FleetState {
  vehicles: Vehicle[];
  selectedId: ID | null;
  select: (id: ID | null) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: ID) => void;
  setVehicles: (vehicles: Vehicle[], selectedId?: ID | null) => void;
  toggleAvailability: (id: ID) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  vehicles: FLEET_SEED,
  selectedId: FLEET_SEED[0]?.id ?? null,

  select: (id) => set({ selectedId: id }),

  addVehicle: (vehicle) =>
    set((s) => ({ vehicles: [...s.vehicles, vehicle], selectedId: vehicle.id })),

  updateVehicle: (vehicle) =>
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
    })),

  removeVehicle: (id) =>
    set((s) => ({
      vehicles: s.vehicles.filter((v) => v.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  setVehicles: (vehicles, selectedId) =>
    set((s) => ({
      vehicles,
      selectedId: selectedId ?? s.selectedId ?? vehicles[0]?.id ?? null,
    })),

  toggleAvailability: (id) =>
    set((s) => ({
      vehicles: s.vehicles.map((v) =>
        v.id === id
          ? {
              ...v,
              available: !v.available,
              status: !v.available ? 'available' : 'maintenance',
            }
          : v,
      ),
    })),
}));

/* ------------------------- Phase 5 persistence ------------------------- */

const PERSISTED_KEY = 'lumina.fleet.persisted.v1';

function fleetConfig() {
  return { name: 'Lumina Fleet', baseCity: 'Chennai', baseLocation: { lat: 13.0827, lng: 80.2707 } };
}

/** Restore the user's customized fleet from Firestore / localStorage. */
export async function hydrateFleet(): Promise<void> {
  if (localStorage.getItem(PERSISTED_KEY) !== '1') return;
  try {
    const snapshot = await db.getSnapshot();
    if (snapshot.vehicles.length > 0) {
      useFleetStore.getState().setVehicles(snapshot.vehicles, snapshot.vehicles[0]?.id ?? null);
    }
  } catch (err) {
    console.warn('[fleet] hydrate failed, falling back to seed:', err);
  }
}

/** Persist current fleet + shipments snapshot (Firestore with localStorage fallback). */
export async function persistFleet(): Promise<void> {
  localStorage.setItem(PERSISTED_KEY, '1');
  const { vehicles } = useFleetStore.getState();
  const shipments = useShipmentsStore.getState().shipments;
  try {
    await db.saveSnapshot({ vehicles, shipments, fleetConfig: fleetConfig() });
  } catch (err) {
    console.warn('[fleet] persist failed:', err);
  }
}