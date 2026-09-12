import type { DashboardStats } from '@/types';

export interface DeliveryTrend {
  date: string;
  deliveries: number;
  onTime: number;
}

export interface FleetStatusData {
  name: string;
  value: number;
  fill: string;
}

export interface FuelData {
  vehicle: string;
  efficiency: number;
  type: string;
}

export interface CarbonData {
  month: string;
  emissions: number;
  savings: number;
}

export interface AiRecommendation {
  id: string;
  type: 'optimization' | 'warning' | 'info';
  title: string;
  description: string;
  impact: string;
}

export interface HealthRow {
  id: string;
  name: string;
  type: string;
  health: number;
  status: string;
  nextService: string;
}

export const DELIVERY_TREND: DeliveryTrend[] = [
  { date: 'Sep 1', deliveries: 34, onTime: 31 },
  { date: 'Sep 2', deliveries: 42, onTime: 39 },
  { date: 'Sep 3', deliveries: 38, onTime: 36 },
  { date: 'Sep 4', deliveries: 48, onTime: 44 },
  { date: 'Sep 5', deliveries: 52, onTime: 48 },
  { date: 'Sep 6', deliveries: 31, onTime: 29 },
  { date: 'Sep 7', deliveries: 36, onTime: 33 },
  { date: 'Sep 8', deliveries: 45, onTime: 42 },
  { date: 'Sep 9', deliveries: 50, onTime: 46 },
  { date: 'Sep 10', deliveries: 44, onTime: 41 },
  { date: 'Sep 11', deliveries: 39, onTime: 37 },
  { date: 'Sep 12', deliveries: 47, onTime: 43 },
  { date: 'Sep 13', deliveries: 53, onTime: 50 },
  { date: 'Sep 14', deliveries: 41, onTime: 38 },
];

export const FLEET_STATUS: FleetStatusData[] = [
  { name: 'Active', value: 12, fill: 'var(--success)' },
  { name: 'In Transit', value: 6, fill: 'var(--accent)' },
  { name: 'Maintenance', value: 3, fill: 'var(--amber)' },
  { name: 'Offline', value: 3, fill: 'var(--ink-faint)' },
];

export const FUEL_DATA: FuelData[] = [
  { vehicle: 'MH-12 AB 2201', efficiency: 6.8, type: 'Heavy Truck' },
  { vehicle: 'TN-01 CD 5543', efficiency: 7.2, type: 'Heavy Truck' },
  { vehicle: 'KA-03 EF 1190', efficiency: 5.4, type: 'Mini Truck' },
  { vehicle: 'TN-37 GH 8821', efficiency: 4.8, type: 'Tempo' },
  { vehicle: 'KL-07 IJ 3305', efficiency: 5.1, type: 'Tempo' },
  { vehicle: 'AP-28 KL 7744', efficiency: 3.9, type: 'Delivery Van' },
];

export const CARBON_DATA: CarbonData[] = [
  { month: 'Apr', emissions: 3200, savings: 340 },
  { month: 'May', emissions: 3800, savings: 420 },
  { month: 'Jun', emissions: 4100, savings: 510 },
  { month: 'Jul', emissions: 3900, savings: 620 },
  { month: 'Aug', emissions: 4400, savings: 740 },
  { month: 'Sep', emissions: 3500, savings: 680 },
  { month: 'Oct', emissions: 2900, savings: 810 },
];

export const AI_RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: 'rec-1',
    type: 'optimization',
    title: 'Consolidate Chennai–Coimbatore routes',
    description:
      'Two separate heavy truck shipments departing within 2 hours can be merged, saving fuel and reducing CO₂.',
    impact: 'Save ₹4,200',
  },
  {
    id: 'rec-2',
    type: 'warning',
    title: 'MH-12 AB 2201 needs service soon',
    description:
      'This vehicle is 890 km past its maintenance interval. Schedule service to avoid breakdown risk.',
    impact: 'Avoid ₹18,000',
  },
  {
    id: 'rec-3',
    type: 'info',
    title: 'Peak demand expected next week',
    description:
      'ML forecast predicts a 22% surge in shipments on Tuesday. Pre-position 2 additional vehicles.',
    impact: 'Handle +12 loads',
  },
  {
    id: 'rec-4',
    type: 'optimization',
    title: 'Switch TN-37 GH to CNG route',
    description:
      'Based on fuel price trends, CNG refuelling on the Salem corridor reduces cost-per-km by 18%.',
    impact: 'Save ₹1,800',
  },
  {
    id: 'rec-5',
    type: 'warning',
    title: 'Fleet health trending downward',
    description:
      'Average fleet score dropped 4 points this month. 3 vehicles are below 70 health — prioritise inspection.',
    impact: '-6% risk',
  },
];

export const FLEET_HEALTH: HealthRow[] = [
  { id: 'v1', name: 'MH-12 AB 2201', type: 'Heavy Truck', health: 95, status: 'Excellent', nextService: '2,400 km' },
  { id: 'v2', name: 'TN-01 CD 5543', type: 'Heavy Truck', health: 82, status: 'Good', nextService: '1,100 km' },
  { id: 'v3', name: 'KA-03 EF 1190', type: 'Mini Truck', health: 78, status: 'Good', nextService: '780 km' },
  { id: 'v4', name: 'TN-37 GH 8821', type: 'Tempo', health: 68, status: 'Fair', nextService: '320 km' },
  { id: 'v5', name: 'KL-07 IJ 3305', type: 'Tempo', health: 62, status: 'Fair', nextService: '150 km' },
  { id: 'v6', name: 'AP-28 KL 7744', type: 'Delivery Van', health: 91, status: 'Excellent', nextService: '3,100 km' },
];

export const DASHBOARD_STATS: DashboardStats = {
  totalVehicles: 24,
  availableVehicles: 17,
  activeDeliveries: 9,
  avgHealthScore: 87,
  totalDistanceKm: 12840,
  totalDeliveries: 342,
  onTimeRate: 94,
  fuelCost: 284500,
  co2Emitted: 8420,
  routeEfficiency: 91,
  recommendations: [
    'Consolidate Chennai–Coimbatore routes to save ₹4,200',
    'Schedule service for MH-12 AB 2201 within 500 km',
    'Pre-position 2 extra vehicles for Tuesday demand surge',
  ],
};