import { useState } from 'react';
import { Save, Truck } from 'lucide-react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import VehicleStage from '@/components/three/VehicleStage';
import {
  FLEET_COLORS,
  VEHICLE_DEFAULTS,
  VEHICLE_TYPE_DESCRIPTIONS,
  VEHICLE_TYPE_LABELS,
  buildVehicle,
} from '@/features/fleet/data';
import { useFleetStore } from '@/state/fleetStore';
import { cn } from '@/lib/utils';
import type { FuelType, Vehicle, VehicleType } from '@/types';

interface VehicleEditorModalProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing an existing vehicle, null for a new one. */
  vehicle?: Vehicle | null;
}

const TYPES: VehicleType[] = ['heavy-truck', 'mini-truck', 'tempo', 'delivery-van'];
const FUELS: FuelType[] = ['diesel', 'petrol', 'cng', 'electric', 'hybrid'];

export default function VehicleEditorModal({ open, onClose, vehicle }: VehicleEditorModalProps) {
  const addVehicle = useFleetStore((s) => s.addVehicle);
  const updateVehicle = useFleetStore((s) => s.updateVehicle);

  const isEdit = Boolean(vehicle);
  const seed = vehicle ?? buildVehicle('heavy-truck', {});

  const [type, setType] = useState<VehicleType>(seed.type);
  const [name, setName] = useState(seed.name);
  const [plate, setPlate] = useState(seed.plateNumber);
  const [capacity, setCapacity] = useState(String(seed.capacityKg));
  const [fuel, setFuel] = useState<FuelType>(seed.fuelType);
  const [mileage, setMileage] = useState(String(seed.mileageKmpl));
  const [intervalKm, setIntervalKm] = useState(String(seed.maintenanceIntervalKm));
  const [costPerKm, setCostPerKm] = useState(String(seed.operatingCostPerKm));
  const [available, setAvailable] = useState(seed.available);
  const [color, setColor] = useState(seed.color ?? FLEET_COLORS[0].value);

  const defaults = VEHICLE_DEFAULTS[type];
  const canSave = name.trim().length > 1 && (isEdit || plate.trim().length > 2);

  const applyDefaults = (t: VehicleType) => {
    const d = VEHICLE_DEFAULTS[t];
    setType(t);
    setCapacity(String(d.capacityKg));
    setFuel(d.fuelType);
    setMileage(String(d.mileageKmpl));
    setIntervalKm(String(d.maintenanceIntervalKm));
    setCostPerKm(String(d.operatingCostPerKm));
  };

  const handleSave = () => {
    const fields = {
      name: name.trim(),
      plateNumber: plate.trim().toUpperCase(),
      capacityKg: Number(capacity) || defaults.capacityKg,
      fuelType: fuel,
      mileageKmpl: Number(mileage) || defaults.mileageKmpl,
      maintenanceIntervalKm: Number(intervalKm) || defaults.maintenanceIntervalKm,
      operatingCostPerKm: Number(costPerKm) || defaults.operatingCostPerKm,
      available,
      color,
    };
    if (isEdit && vehicle) {
      updateVehicle({ ...vehicle, ...fields, plateNumber: fields.plateNumber || vehicle.plateNumber });
    } else {
      addVehicle(buildVehicle(type, fields));
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit · ${vehicle?.name}` : 'Add Vehicle'}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={handleSave}>
            <Save className="size-4" />
            {isEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Class selector */}
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => (isEdit ? setType(t) : applyDefaults(t))}
              className={cn(
                'focus-ring rounded-[var(--r-md)] border px-2 py-2.5 text-center transition-all duration-200',
                type === t
                  ? 'border-accent/50 bg-accent-soft text-ink'
                  : 'border-[var(--border)] bg-surface text-ink-muted hover:border-[var(--border-h)] hover:text-ink',
              )}
            >
              <span className="block text-[11px] font-semibold">{VEHICLE_TYPE_LABELS[t]}</span>
              <span className="mt-0.5 block text-[10px] text-ink-faint">{VEHICLE_TYPE_DESCRIPTIONS[t]}</span>
            </button>
          ))}
        </div>

        {/* Live 3D configurator preview */}
        <div className="glass relative flex h-56 items-center justify-center overflow-hidden">
          <VehicleStage type={type} color={color} rotateSpeed={1.1} interactive className="h-full w-full" />
          <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-abyss/70 px-2.5 py-1 text-[10px] uppercase tracking-wide text-ink-mid">
            <Truck className="size-3" />
            {VEHICLE_TYPE_LABELS[type]} · live preview
          </span>
        </div>

        {/* Paint swatches */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">Vehicle paint</span>
          <div className="flex flex-wrap items-center gap-2">
            {FLEET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                aria-label={c.name}
                onClick={() => setColor(c.value)}
                className={cn(
                  'size-7 rounded-full border-2 transition-transform hover:scale-110',
                  color === c.value
                    ? 'border-white shadow-[0_0_0_4px_rgba(79,140,255,0.25)]'
                    : 'border-[var(--border)]',
                )}
                style={{ background: c.value }}
              />
            ))}
            <span className="text-xs text-ink-faint">{FLEET_COLORS.find((c) => c.value === color)?.name ?? ''}</span>
          </div>
        </div>

        {/* Identity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Vehicle name" placeholder="e.g. Corridor Runner" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Registration plate" placeholder="e.g. MH-12 XY 3088" value={plate} onChange={(e) => setPlate(e.target.value)} />
        </div>

        {/* Config spec */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Capacity (kg)"
            type="number"
            min={0}
            step={100}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">Fuel type</span>
            <div className="flex h-9 flex-wrap gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-surface px-1.5 py-0.5">
              {FUELS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFuel(f)}
                  className={cn(
                    'rounded-[var(--r-xs)] px-1.5 text-[11px] font-medium transition-colors',
                    fuel === f ? 'bg-accent-soft text-accent' : 'text-ink-faint hover:text-ink-mid',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Efficiency (km/L)"
            type="number"
            min={0.5}
            step={0.1}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />
          <Input
            label="Service interval (km)"
            type="number"
            min={0}
            step={500}
            value={intervalKm}
            onChange={(e) => setIntervalKm(e.target.value)}
          />
          <Input
            label="Operating cost (₹/km)"
            type="number"
            min={0}
            step={0.5}
            value={costPerKm}
            onChange={(e) => setCostPerKm(e.target.value)}
          />
          <div className="flex flex-col justify-end pb-1">
            <button
              type="button"
              onClick={() => setAvailable((v) => !v)}
              role="switch"
              aria-checked={available}
              className={cn(
                'flex h-9 items-center justify-center gap-2 rounded-[var(--r-sm)] border px-3 text-xs font-medium transition-colors',
                available
                  ? 'border-success/30 bg-success-soft text-success'
                  : 'border-[var(--border)] bg-surface text-ink-faint',
              )}
            >
              <span className={cn('size-2 rounded-full', available ? 'bg-success' : 'bg-ink-faint')} />
              {available ? 'Available for dispatch' : 'Not available'}
            </button>
          </div>
        </div>

        {/* Class spec caption */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info" size="sm">Class spec applied</Badge>
          <span className="text-xs text-ink-faint">
            {defaults.capacityKg.toLocaleString()} kg · {defaults.fuelType} · {defaults.mileageKmpl} km/L ·
            ₹{defaults.operatingCostPerKm}/km — every field is editable.
          </span>
        </div>
      </div>
    </Modal>
  );
}