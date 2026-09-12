import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Fuel, Gauge, MapPin, Pencil, Power, Route as RouteIcon, Sparkles, Trash2, Truck } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressRing from '@/components/ui/ProgressRing';
import VehicleStage from '@/components/three/VehicleStage';
import { VEHICLE_TYPE_LABELS } from '@/features/fleet/data';
import { rankVehiclesForLoad } from '@/services/assignment';
import { useFleetStore } from '@/state/fleetStore';
import { formatINR } from '@/lib/utils';
import { type Vehicle } from '@/types';

function statusVariant(status: Vehicle['status']): 'success' | 'info' | 'warning' | 'neutral' {
  switch (status) {
    case 'available':
      return 'success';
    case 'in-transit':
      return 'info';
    case 'maintenance':
      return 'warning';
    default:
      return 'neutral';
  }
}

function healthVariant(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 65) return 'warning';
  return 'danger';
}

function SpecRow({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-xs text-ink-muted">
        <Icon className="size-3.5 text-ink-faint" />
        {label}
      </span>
      <span className="text-xs font-medium text-ink">{value}</span>
    </div>
  );
}

interface VehicleDetailPanelProps {
  vehicle: Vehicle;
  onEdit: () => void;
}

export default function VehicleDetailPanel({ vehicle, onEdit }: VehicleDetailPanelProps) {
  const navigate = useNavigate();
  const vehicles = useFleetStore((s) => s.vehicles);
  const toggleAvailability = useFleetStore((s) => s.toggleAvailability);
  const removeVehicle = useFleetStore((s) => s.removeVehicle);

  const aiRank = useMemo(() => {
    const ranked = rankVehiclesForLoad({ vehicles, weightKg: 5000, distanceKm: 340 });
    const index = ranked.findIndex((r) => r.vehicleId === vehicle.id);
    return index === -1 ? null : index + 1;
  }, [vehicles, vehicle.id]);

  const remaining = Math.max(0, vehicle.maintenanceIntervalKm - (vehicle.currentOdometerKm - vehicle.lastMaintenanceKm));

  return (
    <Card variant="strong" padding="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-ink">{vehicle.name}</p>
          <p className="font-mono text-xs text-ink-faint">{vehicle.plateNumber}</p>
        </div>
        <Badge variant={statusVariant(vehicle.status)} size="sm">{vehicle.status.replace('-', ' ')}</Badge>
      </div>

      {aiRank && (
        <div className="flex items-center gap-2 rounded-[var(--r-sm)] border border-violet/25 bg-violet-soft px-3 py-2">
          <Sparkles className="size-3.5 text-violet" />
          <span className="text-xs text-ink-mid">
            AI ranks this <span className="font-semibold text-ink">#{aiRank} of {vehicles.length}</span> for a 5-ton, 340 km run
          </span>
        </div>
      )}

      <div className="glass flex h-48 items-center justify-center overflow-hidden">
        <VehicleStage type={vehicle.type} color={vehicle.color} rotateSpeed={1.2} interactive className="h-full w-full" />
      </div>

      <div className="flex items-center justify-between rounded-[var(--r-md)] bg-surface px-3 py-2.5">
        <span className="text-xs text-ink-muted">Fleet health</span>
        <ProgressRing value={vehicle.healthScore} size={44} strokeWidth={4.5} label={`${vehicle.healthScore}`} variant={healthVariant(vehicle.healthScore)} />
      </div>

      <div className="border-y border-[var(--border)]/60">
        <SpecRow icon={Truck} label="Class" value={VEHICLE_TYPE_LABELS[vehicle.type]} />
        <SpecRow icon={Gauge} label="Capacity" value={`${vehicle.capacityKg.toLocaleString()} kg`} />
        <SpecRow icon={Fuel} label="Fuel / efficiency" value={`${vehicle.fuelType} · ${vehicle.mileageKmpl} km/L`} />
        <SpecRow icon={Calendar} label="Operating cost" value={formatINR(vehicle.operatingCostPerKm) + '/km'} />
        <SpecRow icon={MapPin} label="Until next service" value={`${remaining.toLocaleString()} km`} />
        <SpecRow icon={Gauge} label="Odometer" value={`${vehicle.currentOdometerKm.toLocaleString()} km`} />
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="primary" size="sm" onClick={() => navigate('/routes')}>
          <RouteIcon className="size-3.5" />
          Assign to Route
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleAvailability(vehicle.id)}>
            <Power className="size-3.5" />
            {vehicle.available ? 'Unavailable' : 'Make Available'}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft"
          onClick={() => removeVehicle(vehicle.id)}
        >
          <Trash2 className="size-3.5" />
          Remove Vehicle
        </Button>
      </div>
    </Card>
  );
}