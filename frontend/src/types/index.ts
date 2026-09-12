/** Shared domain models for the Smart Logistics platform. */

export type ID = string;

export type VehicleType = 'heavy-truck' | 'mini-truck' | 'tempo' | 'delivery-van';

export type VehicleStatus = 'active' | 'in-transit' | 'maintenance' | 'available' | 'offline';

export type FuelType = 'diesel' | 'petrol' | 'cng' | 'electric' | 'hybrid';

export interface Vehicle {
  id: ID;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  plateNumber: string;
  capacityKg: number;
  mileageKmpl: number;
  fuelType: FuelType;
  operatingCostPerKm: number;
  maintenanceIntervalKm: number;
  lastMaintenanceKm: number;
  currentOdometerKm: number;
  available: boolean;
  addedAt: string;
  healthScore: number;
  imageSeed?: number;
  color?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Stop {
  id: ID;
  name: string;
  city: string;
  location: GeoPoint;
}

export type ShipmentStatus =
  | 'planned'
  | 'assigned'
  | 'in-transit'
  | 'delivered'
  | 'delayed'
  | 'cancelled';

export interface Shipment {
  id: ID;
  reference: string;
  pickup: Stop;
  stops: Stop[];
  destination: Stop;
  createdAt: string;
  status: ShipmentStatus;
  weightKg?: number;
  costEstimate?: number;
  assignedVehicleId?: ID;
  route?: RouteResult;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  geometry: GeoPoint[];
  steps: string[];
  fuelEstimateL: number;
  costEstimate: number;
  co2EstimateKg: number;
  provider: 'ors' | 'local';
  profile?: string;
  congestionPct?: number;
  legs?: RouteLeg[];
  orderedWaypoints?: Stop[];
}

export interface RouteLeg {
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMin: number;
}

export interface GeoSearchResult {
  name: string;
  label: string;
  region: string;
  country: string;
  longitude: number;
  latitude: number;
}

export interface AssignmentScore {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  vehicleType: string;
  availability: boolean;
  capacityOk: boolean;
  score: number;
  costEstimate: number;
  co2EstimateKg: number;
  etaMin: number;
  reasons: string[];
}

export interface AssignPlanResult {
  route: RouteResult;
  recommended: AssignmentScore | null;
  ranked: AssignmentScore[];
}

export interface AssignmentRecommendation {
  shipmentId: ID;
  vehicleId: ID;
  vehicleName: string;
  route: RouteResult;
  confidence: number;
  reason: string[];
  score: number;
}

export interface HealthReport {
  vehicleId: ID;
  healthScore: number;
  statusLabel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  nextMaintenanceKm: number;
  predictedFailureRisk: number;
  recommendations: string[];
}

export interface DemandForecast {
  dates: string[];
  actual: number[];
  predicted: number[];
  confidenceInterval: [number, number][];
  recommendedFleetSize: number;
  peakDays: string[];
}

export interface SustainabilityReport {
  fleetCo2Kg: number;
  fleetFuelL: number;
  distanceKm: number;
  ecoSavingsKg: number;
  score: number;
  breakdown: Record<string, number>;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  activeDeliveries: number;
  avgHealthScore: number;
  totalDistanceKm: number;
  totalDeliveries: number;
  onTimeRate: number;
  fuelCost: number;
  co2Emitted: number;
  routeEfficiency: number;
  recommendations: string[];
}

export interface ChatMessage {
  id: ID;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FleetConfig {
  name: string;
  baseCity: string;
  baseLocation: GeoPoint;
}

export interface DatabaseSnapshot {
  vehicles: Vehicle[];
  shipments: Shipment[];
  fleetConfig: FleetConfig;
}

/** Per-vehicle adaptive analytics (computed for the user's own fleet). */
export interface VehicleAnalytics {
  vehicleId: ID;
  vehicleName: string;
  plateNumber: string;
  vehicleType: VehicleType;
  utilizationPct: number;
  estimatedDistanceKm: number;
  estimatedCost: number;
  estimatedCo2Kg: number;
  maintenanceDueKm: number;
  healthScore: number;
}

/** Fleet-level adaptive analytics summary. */
export interface FleetAnalyticsData {
  fleetUtilizationPct: number;
  totalDistanceKm: number;
  estimatedOperatingCost: number;
  estimatedCo2Kg: number;
  vehiclesInMaintenance: number;
  vehiclesDueSoon: number;
  totalCapacityKg: number;
  usedCapacityKg: number;
  perVehicle: VehicleAnalytics[];
}