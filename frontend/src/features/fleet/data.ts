import { type Vehicle, type VehicleType } from '@/types';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  'heavy-truck': 'Heavy Truck',
  'mini-truck': 'Mini Truck',
  tempo: 'Tempo',
  'delivery-van': 'Delivery Van',
};

export const VEHICLE_TYPE_DESCRIPTIONS: Record<VehicleType, string> = {
  'heavy-truck': 'Long-haul freight, high capacity',
  'mini-truck': 'Regional distribution workhorse',
  tempo: 'Compact urban last-mile carrier',
  'delivery-van': 'Light parcel & e-commerce delivery',
};

export interface VehicleDefaults {
  /** Cargo capacity in kg (defaults per class). */
  capacityKg: number;
  fuelType: Vehicle['fuelType'];
  /** Fuel efficiency in km per litre. */
  mileageKmpl: number;
  /** Operating cost per kilometre, in ₹. */
  operatingCostPerKm: number;
  /** Service interval in kilometres. */
  maintenanceIntervalKm: number;
}

/**
 * Phase 5 — Default Vehicle Profiles.
 * Predefined per-class spec sheet applied when a vehicle is first registered.
 * All values remain editable after creation (vehicle personalization).
 *
 * | Class        | Capacity | Fuel   | Mileage | Cost/km | Interval |
 * |--------------|----------|--------|---------|---------|----------|
 * | Heavy Truck  | 10,000 kg | Diesel | 5 km/L  | ₹42     | 20,000 km |
 * | Mini Truck   | 5,000 kg  | Diesel | 7.5 km/L| ₹28     | 12,000 km |
 * | Tempo        | 1,200 kg  | CNG    | 14 km/L | ₹18     |  8,000 km |
 * | Delivery Van | 800 kg    | Petrol | 12 km/L | ₹20     | 10,000 km |
 */
export const VEHICLE_DEFAULTS: Record<VehicleType, VehicleDefaults> = {
  'heavy-truck': { capacityKg: 10000, fuelType: 'diesel', mileageKmpl: 5.0, operatingCostPerKm: 42, maintenanceIntervalKm: 20000 },
  'mini-truck': { capacityKg: 5000, fuelType: 'diesel', mileageKmpl: 7.5, operatingCostPerKm: 28, maintenanceIntervalKm: 12000 },
  tempo: { capacityKg: 1200, fuelType: 'cng', mileageKmpl: 14, operatingCostPerKm: 18, maintenanceIntervalKm: 8000 },
  'delivery-van': { capacityKg: 800, fuelType: 'petrol', mileageKmpl: 12, operatingCostPerKm: 20, maintenanceIntervalKm: 10000 },
};

/** Premium configurator palette — surfaces as vehicle-body colour swatches. */
export const FLEET_COLORS: { name: string; value: string }[] = [
  { name: 'Steel Blue', value: '#3d4a63' },
  { name: 'Graphite', value: '#333a4a' },
  { name: 'Slate Teal', value: '#3e5a63' },
  { name: 'Midnight Violet', value: '#4a3e63' },
  { name: 'Forest', value: '#3e634f' },
  { name: 'Ivory White', value: '#c9d0dd' },
  { name: 'Ember', value: '#9c4638' },
  { name: 'Deep Marine', value: '#2f4f8a' },
];

export const FLEET_SEED: Vehicle[] = [
  {
    id: 'veh-001',
    name: 'Maverick Prime',
    type: 'heavy-truck',
    status: 'in-transit',
    plateNumber: 'MH-12 AB 2201',
    capacityKg: 10000,
    mileageKmpl: 5.0,
    fuelType: 'diesel',
    operatingCostPerKm: 42,
    maintenanceIntervalKm: 20000,
    lastMaintenanceKm: 61200,
    currentOdometerKm: 76300,
    available: false,
    addedAt: '2025-01-14T08:00:00.000Z',
    healthScore: 95,
    imageSeed: 1,
    color: '#3d4a63',
  },
  {
    id: 'veh-002',
    name: 'Titan Hauler',
    type: 'heavy-truck',
    status: 'available',
    plateNumber: 'TN-01 CD 5543',
    capacityKg: 10000,
    mileageKmpl: 4.6,
    fuelType: 'diesel',
    operatingCostPerKm: 46,
    maintenanceIntervalKm: 20000,
    lastMaintenanceKm: 44000,
    currentOdometerKm: 55300,
    available: true,
    addedAt: '2025-02-03T08:00:00.000Z',
    healthScore: 82,
    imageSeed: 2,
    color: '#333a4a',
  },
  {
    id: 'veh-003',
    name: 'Rhino Stacker',
    type: 'mini-truck',
    status: 'available',
    plateNumber: 'KA-03 EF 1190',
    capacityKg: 5000,
    mileageKmpl: 7.5,
    fuelType: 'diesel',
    operatingCostPerKm: 28,
    maintenanceIntervalKm: 12000,
    lastMaintenanceKm: 18200,
    currentOdometerKm: 27300,
    available: true,
    addedAt: '2025-03-21T08:00:00.000Z',
    healthScore: 78,
    imageSeed: 3,
    color: '#3e5a63',
  },
  {
    id: 'veh-004',
    name: 'Corridor Runner',
    type: 'tempo',
    status: 'in-transit',
    plateNumber: 'TN-37 GH 8821',
    capacityKg: 1200,
    mileageKmpl: 14,
    fuelType: 'cng',
    operatingCostPerKm: 18,
    maintenanceIntervalKm: 8000,
    lastMaintenanceKm: 9800,
    currentOdometerKm: 12700,
    available: false,
    addedAt: '2025-04-11T08:00:00.000Z',
    healthScore: 68,
    imageSeed: 4,
    color: '#4a3e63',
  },
  {
    id: 'veh-005',
    name: 'Metro Sprinter',
    type: 'delivery-van',
    status: 'available',
    plateNumber: 'KL-07 IJ 3305',
    capacityKg: 800,
    mileageKmpl: 12,
    fuelType: 'petrol',
    operatingCostPerKm: 20,
    maintenanceIntervalKm: 10000,
    lastMaintenanceKm: 6100,
    currentOdometerKm: 9200,
    available: true,
    addedAt: '2025-05-02T08:00:00.000Z',
    healthScore: 91,
    imageSeed: 5,
    color: '#3e634f',
  },
  {
    id: 'veh-006',
    name: 'City Courier 2',
    type: 'tempo',
    status: 'maintenance',
    plateNumber: 'AP-28 KL 7744',
    capacityKg: 1200,
    mileageKmpl: 13.5,
    fuelType: 'cng',
    operatingCostPerKm: 19,
    maintenanceIntervalKm: 8000,
    lastMaintenanceKm: 6400,
    currentOdometerKm: 6900,
    available: false,
    addedAt: '2025-05-27T08:00:00.000Z',
    healthScore: 55,
    imageSeed: 6,
    color: '#9c4638',
  },
  {
    id: 'veh-007',
    name: 'Urban Bay Runner',
    type: 'mini-truck',
    status: 'available',
    plateNumber: 'TN-33 MN 9081',
    capacityKg: 5000,
    mileageKmpl: 7.1,
    fuelType: 'diesel',
    operatingCostPerKm: 30,
    maintenanceIntervalKm: 12000,
    lastMaintenanceKm: 3100,
    currentOdometerKm: 7300,
    available: true,
    addedAt: '2025-06-18T08:00:00.000Z',
    healthScore: 88,
    imageSeed: 7,
    color: '#2f4f8a',
  },
];

/**
 * Build a fresh vehicle from class defaults + user customization.
 * Unknown values always fall back to the class specification, so a valid
 * vehicle exists even when a user skips fields in the configurator.
 */
export function buildVehicle(type: VehicleType, partial: Partial<Vehicle>): Vehicle {
  const defaults = VEHICLE_DEFAULTS[type];
  return {
    id: partial.id ?? `veh-${Date.now().toString(36)}`,
    name: partial.name ?? `${VEHICLE_TYPE_LABELS[type]} · New`,
    type,
    status: partial.available ? 'available' : 'maintenance',
    plateNumber: partial.plateNumber ?? 'TBD',
    capacityKg: partial.capacityKg ?? defaults.capacityKg,
    mileageKmpl: partial.mileageKmpl ?? defaults.mileageKmpl,
    fuelType: partial.fuelType ?? defaults.fuelType,
    operatingCostPerKm: partial.operatingCostPerKm ?? defaults.operatingCostPerKm,
    maintenanceIntervalKm: partial.maintenanceIntervalKm ?? defaults.maintenanceIntervalKm,
    lastMaintenanceKm: partial.lastMaintenanceKm ?? 0,
    currentOdometerKm: partial.currentOdometerKm ?? 0,
    available: partial.available ?? true,
    addedAt: partial.addedAt ?? new Date().toISOString(),
    healthScore: partial.healthScore ?? 100,
    imageSeed: Math.floor(Math.random() * 999),
    color: partial.color ?? FLEET_COLORS[0].value,
  };
}