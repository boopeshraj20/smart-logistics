import { doc, getDoc, setDoc } from 'firebase/firestore';

import { type DatabaseSnapshot, type Vehicle, type Shipment } from '@/types';
import { firebaseEnabled, firebaseDb } from '@/services/firebase';

/**
 * Data access layer.
 *
 * Cloud Firestore when Firebase credentials are present; localStorage mock
 * otherwise. The Firestore adapter falls back to localStorage automatically
 * on any error (offline, rules blocking) so presentations never break.
 */

export interface DatabaseAdapter {
  getSnapshot(): Promise<DatabaseSnapshot>;
  saveSnapshot(snapshot: DatabaseSnapshot): Promise<void>;
  upsertVehicle(vehicle: Vehicle): Promise<void>;
  upsertShipment(shipment: Shipment): Promise<void>;
}

/* -------------------------------- helpers --------------------------------- */

function emptySnapshot(): DatabaseSnapshot {
  return {
    vehicles: [],
    shipments: [],
    fleetConfig: { name: '', baseCity: '', baseLocation: { lat: 13.0827, lng: 80.2707 } },
  };
}

function parseSnapshot(raw: string | null | undefined): DatabaseSnapshot | null {
  if (raw == null || raw.length === 0) return null;
  try { return JSON.parse(raw) as DatabaseSnapshot; } catch { return null; }
}

/* ------------------------------ Local adapter ------------------------------ */

const STORAGE_KEY = 'lumina.snapshot.v1';

const localAdapter: DatabaseAdapter = {
  async getSnapshot() {
    return parseSnapshot(localStorage.getItem(STORAGE_KEY)) ?? emptySnapshot();
  },
  async saveSnapshot(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); },
  async upsertVehicle(v) {
    const s = await localAdapter.getSnapshot();
    const i = s.vehicles.findIndex((x) => x.id === v.id);
    if (i >= 0) s.vehicles[i] = v; else s.vehicles.push(v);
    await localAdapter.saveSnapshot(s);
  },
  async upsertShipment(shipment) {
    const s = await localAdapter.getSnapshot();
    const i = s.shipments.findIndex((x) => x.id === shipment.id);
    if (i >= 0) s.shipments[i] = shipment; else s.shipments.push(shipment);
    await localAdapter.saveSnapshot(s);
  },
};

/* ----------------------------- Firebase adapter ---------------------------- */

const SNAPSHOT_DOC = doc(firebaseDb!, 'state', 'snapshot');

const firebaseAdapter: DatabaseAdapter = {
  async getSnapshot() {
    const snap = await getDoc(SNAPSHOT_DOC);
    if (snap.exists()) return snap.data() as DatabaseSnapshot;
    const fresh = emptySnapshot();
    await setDoc(SNAPSHOT_DOC, fresh);
    return fresh;
  },
  async saveSnapshot(s) { await setDoc(SNAPSHOT_DOC, s); },
  async upsertVehicle(v) {
    const s = await firebaseAdapter.getSnapshot();
    const i = s.vehicles.findIndex((x) => x.id === v.id);
    if (i >= 0) s.vehicles[i] = v; else s.vehicles.push(v);
    await setDoc(SNAPSHOT_DOC, s);
  },
  async upsertShipment(shipment) {
    const s = await firebaseAdapter.getSnapshot();
    const i = s.shipments.findIndex((x) => x.id === shipment.id);
    if (i >= 0) s.shipments[i] = shipment; else s.shipments.push(shipment);
    await setDoc(SNAPSHOT_DOC, s);
  },
};

/* ---------------------------- Select adapter ------------------------------- */

async function withFallback<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[db] Firestore unavailable, using local fallback:', err);
    // We still call fn, but local fallback will be used by caller if needed.
    // Re-throw on actual failure so callers can handle.
    throw err;
  }
}

/**
 * Active database adapter.
 * Firebase primary; callers should catch and fall back to local if needed,
 * or the data seeding layer handles it.
 */
export const db: DatabaseAdapter = firebaseEnabled
  ? {
      getSnapshot: () => withFallback(() => firebaseAdapter.getSnapshot()).catch(() => localAdapter.getSnapshot()),
      saveSnapshot: (s) => withFallback(() => firebaseAdapter.saveSnapshot(s)).catch(() => localAdapter.saveSnapshot(s)),
      upsertVehicle: (v) => withFallback(() => firebaseAdapter.upsertVehicle(v)).catch(() => localAdapter.upsertVehicle(v)),
      upsertShipment: (s) => withFallback(() => firebaseAdapter.upsertShipment(s)).catch(() => localAdapter.upsertShipment(s)),
    }
  : localAdapter;

export { uid } from '@/lib/utils';