/**
 * Demo Mode dataset.
 *
 * Generates a realistic enterprise-size fleet + shipment history using a
 * deterministic seeded PRNG, so "Load demo dataset" shows the same believable
 * data every time. Shipments are distributed across the last 14 days with
 * realistic weights, costs, fuel and CO₂ derived from the vehicle sub-scores.
 */

import { FLEET_COLORS, VEHICLE_DEFAULTS, VEHICLE_TYPE_LABELS } from '@/features/fleet/data';
import type { Shipment, Stop, Vehicle, VehicleType } from '@/types';
import { useFleetStore } from '@/state/fleetStore';
import { useShipmentsStore } from '@/state/shipmentsStore';

const CO2_PER_LITRE = 2.68;

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CityPoint {
  name: string;
  city: string;
  location: { lat: number; lng: number };
}

const CITIES: CityPoint[] = [
  { name: 'Chennai Goods Terminal', city: 'Tamil Nadu', location: { lat: 13.0827, lng: 80.2707 } },
  { name: 'Bangalore Distribution Centre', city: 'Karnataka', location: { lat: 12.9716, lng: 77.5946 } },
  { name: 'Hyderabad Fulfilment Hub', city: 'Telangana', location: { lat: 17.385, lng: 78.4867 } },
  { name: 'Coimbatore Warehouse', city: 'Tamil Nadu', location: { lat: 11.0168, lng: 76.9558 } },
  { name: 'Kochi Metro Depot', city: 'Kerala', location: { lat: 9.9312, lng: 76.2673 } },
  { name: 'Pune Logistics Park', city: 'Maharashtra', location: { lat: 18.5204, lng: 73.8567 } },
  { name: 'Mumbai Port Terminal', city: 'Maharashtra', location: { lat: 19.076, lng: 72.8777 } },
  { name: 'Delhi Cargo Hub', city: 'Delhi NCR', location: { lat: 28.6139, lng: 77.209 } },
  { name: 'Ahmedabad Cross Dock', city: 'Gujarat', location: { lat: 23.0225, lng: 72.5714 } },
  { name: 'Jaipur Fulfilment Centre', city: 'Rajasthan', location: { lat: 26.9124, lng: 75.7873 } },
  { name: 'Lucknow Node', city: 'Uttar Pradesh', location: { lat: 26.8467, lng: 80.9462 } },
  { name: 'Patna Regional Depot', city: 'Bihar', location: { lat: 25.5941, lng: 85.1376 } },
];

const TYPE_POOL: VehicleType[] = ['heavy-truck', 'heavy-truck', 'mini-truck', 'mini-truck', 'tempo', 'tempo', 'delivery-van', 'delivery-van'];

const NAME_POOL = [
  ['Maverick Prime', 'Titan Hauler', 'Cargo Baron', 'Ironline', 'Highway King', 'Pallet Master', 'Route Chief', 'Axle Apex'],
  ['Rhino Stacker', 'Urban Bay Runner', 'City Freighter', 'Sprint Loader', 'Metro Hulk', 'District Hauler'],
  ['Corridor Runner', 'Metro Sprinter', 'Market Dasher', 'Lane Hopper', 'Bazaar Cruiser'],
  ['City Courier', 'Parcel Pilot', 'Nimble Sprite', 'Micro Mover', 'Van Guard'],
];

const RTO_PREFIX = ['MH-12', 'TN-01', 'KA-03', 'KL-07', 'AP-28', 'TG-09', 'DL-01', 'GJ-01'];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function toStop(city: CityPoint): Stop {
  return { id: `loc-${city.city.toLowerCase().replace(/[^a-z]/g, '-')}`, name: city.name, city: city.city, location: city.location };
}

function pickCity(random: () => number, exclude: CityPoint): CityPoint {
  const others = CITIES.filter((c) => c.name !== exclude.name);
  return others[Math.floor(random() * others.length)];
}

function buildDemoFleet(random: () => number): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const usedPlates = new Set<string>();
  for (let i = 0; i < 14; i += 1) {
    const type = TYPE_POOL[i % TYPE_POOL.length] as VehicleType;
    let plate = '';
    do {
      plate = `${RTO_PREFIX[i % RTO_PREFIX.length]} ${random() < 0.5 ? 'AB' : 'CD'} ${String(1000 + Math.floor(random() * 9000))}`;
    } while (usedPlates.has(plate));
    usedPlates.add(plate);

    const defaults = VEHICLE_DEFAULTS[type];
    const interval = defaults.maintenanceIntervalKm;
    const last = Math.floor(random() * interval * 0.85);
    const current = last + Math.floor(random() * interval * 0.8);
    const health = Math.round(Math.max(45, 100 - (current - last) / interval * 26 - random() * 12));
    const available = i % 3 !== 2;

    vehicles.push({
      id: `veh-demo-${String(i + 1).padStart(2, '0')}`,
      name: NAME_POOL[TYPE_POOL.indexOf(type)][i % NAME_POOL[TYPE_POOL.indexOf(type)].length],
      type,
      status: available ? 'available' : i % 3 === 0 ? 'in-transit' : 'maintenance',
      plateNumber: plate,
      capacityKg: defaults.capacityKg,
      mileageKmpl: Math.max(2, defaults.mileageKmpl + (random() - 0.5) * 1.8),
      fuelType: defaults.fuelType,
      operatingCostPerKm: defaults.operatingCostPerKm + Math.round((random() - 0.5) * 6),
      maintenanceIntervalKm: interval,
      lastMaintenanceKm: last,
      currentOdometerKm: current,
      available,
      addedAt: new Date(Date.now() - (60 + i * 14) * 86400000).toISOString(),
      healthScore: health,
      imageSeed: i + 1,
      color: FLEET_COLORS[i % FLEET_COLORS.length].value,
    });
  }
  return vehicles;
}

function buildDemoShipments(random: () => number, vehicles: Vehicle[]): Shipment[] {
  const shipments: Shipment[] = [];
  const statuses: Shipment['status'][] = ['delivered', 'delivered', 'delivered', 'in-transit', 'delivered', 'planned', 'delayed', 'delivered', 'in-transit'];

  for (let i = 0; i < 22; i += 1) {
    const start = CITIES[i % 2 === 0 ? 0 : 1];
    const destination = pickCity(random, start);
    const weightKg = [800, 1200, 1500, 2500, 4000, 5800, 7000, 9500][Math.floor(random() * 8)];
    const sizeOk = vehicles.filter((v) => v.capacityKg >= weightKg);
    const candidate = sizeOk[Math.floor(random() * sizeOk.length)] ?? vehicles[0];

    const distance = haversineKm(start.location, destination.location);
    const durationMin = Math.round((distance / 45) * 60 * (0.9 + random() * 0.3));
    const fuelL = distance / Math.max(candidate.mileageKmpl, 0.1);
    const cost = Math.round(distance * candidate.operatingCostPerKm);
    const daysAgo = i % 9; // spread over the last ~9 days
    const status = statuses[i % statuses.length];
    const intermediate = random() < 0.3 ? [pickCity(random, destination)] : [];

    shipments.push({
      id: `shp-demo-${String(i + 1).padStart(3, '0')}`,
      reference: `SH-D${String(1000 + i)}`,
      pickup: toStop(start),
      stops: intermediate.map(toStop),
      destination: toStop(destination),
      createdAt: new Date(Date.now() - daysAgo * 86400000 - Math.floor(random() * 8) * 3600000).toISOString(),
      status,
      weightKg,
      costEstimate: cost,
      assignedVehicleId: candidate.id,
      route: {
        distanceKm: distance,
        durationMin,
        geometry: [],
        steps: [],
        fuelEstimateL: Math.round(fuelL),
        costEstimate: cost,
        co2EstimateKg: Math.round(fuelL * CO2_PER_LITRE),
        provider: 'ors',
      },
    });
  }

  return shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildDemoDataset() {
  const random = mulberry32(20260817);
  const vehicles = buildDemoFleet(random);
  const shipments = buildDemoShipments(random, vehicles);
  return { vehicles, shipments };
}

/** Replace the current fleet + shipments with the demo dataset. */
export function loadDemoDataset(): { vehicles: Vehicle[]; shipments: Shipment[] } {
  const { vehicles, shipments } = buildDemoDataset();
  useFleetStore.getState().setVehicles(vehicles, vehicles[0]?.id ?? null);
  useShipmentsStore.getState().setShipments(shipments);
  return { vehicles, shipments };
}

/** Restore the compact out-of-the-box seed fleet + shipments. */
export function resetToSeed() {
  try {
    localStorage.removeItem('lumina.fleet.persisted.v1');
    localStorage.removeItem('lumina.snapshot.v1');
  } catch {
    /* ignore */
  }
  useFleetStore.getState().setVehicles([], null);
  window.location.reload();
}

export function describeVehicle(vehicle: Vehicle): string {
  return `${vehicle.name} · ${VEHICLE_TYPE_LABELS[vehicle.type]}`;
}