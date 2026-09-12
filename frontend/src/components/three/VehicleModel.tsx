import { RoundedBox } from '@react-three/drei';
import { type Group } from 'three';
import { type VehicleType } from '@/types';
import { palette } from './palette';

interface WheelProps {
  position: [number, number, number];
  radius?: number;
  width?: number;
}

function Wheel({ position, radius = 0.42, width = 0.3 }: WheelProps) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, width, 20]} />
        <meshStandardMaterial color={palette.rubber} roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.52, radius * 0.52, width + 0.04, 14]} />
        <meshStandardMaterial color={palette.rim} roughness={0.35} metalness={0.6} />
      </mesh>
    </group>
  );
}

function Panel({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={palette.chassis} roughness={0.6} metalness={0.3} />
    </mesh>
  );
}

function Glass({ position, size = [1.6, 0.5, 0.05] }: { position: [number, number, number]; size?: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={palette.glass}
        roughness={0.08}
        metalness={0.8}
        emissive={palette.glass}
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

function Headlight({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.2, 0.11, 0.04]} />
      <meshStandardMaterial color={palette.lens} emissive={palette.lens} emissiveIntensity={0.8} roughness={0.2} />
    </mesh>
  );
}

function HeavyTruck({ color }: { color: string }) {
  return (
    <group scale={0.92}>
      <Panel position={[-0.98, 0.45, 0]} size={[0.12, 0.16, 8.6]} />
      <Panel position={[0.98, 0.45, 0]} size={[0.12, 0.16, 8.6]} />

      <RoundedBox args={[2.05, 1.55, 1.9]} radius={0.09} smoothness={3} position={[0, 1.05, 2.6]}>
        <meshStandardMaterial color={color} roughness={0.34} metalness={0.28} />
      </RoundedBox>
      <Glass position={[0, 1.62, 3.56]} size={[1.75, 0.5, 0.06]} />
      <RoundedBox args={[1.85, 0.62, 0.92]} radius={0.06} smoothness={2} position={[0, 0.8, 3.4]}>
        <meshStandardMaterial color={palette.bodyDeep} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.8, 3.9]}>
        <boxGeometry args={[1.55, 0.15, 0.03]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
      <Headlight position={[0.82, 0.9, 3.92]} />
      <Headlight position={[-0.82, 0.9, 3.92]} />
      <Panel position={[1.2, 1.6, 3.1]} size={[0.06, 0.25, 0.12]} />
      <Panel position={[-1.2, 1.6, 3.1]} size={[0.06, 0.25, 0.12]} />

      <mesh position={[0.82, 0.4, 2.6]}>
        <cylinderGeometry args={[0.17, 0.17, 0.55, 14]} />
        <meshStandardMaterial color={palette.chassis} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-0.82, 0.4, 2.6]}>
        <cylinderGeometry args={[0.17, 0.17, 0.55, 14]} />
        <meshStandardMaterial color={palette.chassis} roughness={0.5} metalness={0.6} />
      </mesh>

      <RoundedBox args={[2.55, 2.75, 7.4]} radius={0.14} smoothness={3} position={[0, 1.9, -1.55]}>
        <meshStandardMaterial color={palette.bodyAlt} roughness={0.3} metalness={0.25} />
      </RoundedBox>
      <Panel position={[1.28, 1.1, -1.55]} size={[0.03, 0.16, 7.2]} />
      <Panel position={[-1.28, 1.1, -1.55]} size={[0.03, 0.16, 7.2]} />
      <mesh position={[0, 2.98, -1.55]}>
        <boxGeometry args={[2.49, 0.04, 7.0]} />
        <meshStandardMaterial color={palette.bodyAlt} roughness={0.3} metalness={0.2} />
      </mesh>
      <Panel position={[0, 1.62, -2.5]} size={[0.03, 1.5, 0.03]} />
      <Panel position={[0, 1.62, -0.6]} size={[0.03, 1.5, 0.03]} />
      <Panel position={[0, 1.62, 1.3]} size={[0.03, 1.5, 0.03]} />

      <Wheel position={[1.08, 0.42, 1.1]} />
      <Wheel position={[-1.08, 0.42, 1.1]} />
      <Wheel position={[1.24, 0.42, -2.9]} />
      <Wheel position={[-1.24, 0.42, -2.9]} />
      <Wheel position={[1.24, 0.42, -3.95]} />
      <Wheel position={[-1.24, 0.42, -3.95]} />
    </group>
  );
}

function MiniTruck({ color }: { color: string }) {
  return (
    <group scale={0.9}>
      <Panel position={[-0.86, 0.42, 0]} size={[0.1, 0.14, 3.4]} />
      <Panel position={[0.86, 0.42, 0]} size={[0.1, 0.14, 3.4]} />

      <RoundedBox args={[1.7, 1.5, 1.3]} radius={0.08} smoothness={2} position={[0, 1.08, 1.2]}>
        <meshStandardMaterial color={color} roughness={0.34} metalness={0.28} />
      </RoundedBox>
      <Glass position={[0, 1.55, 1.88]} size={[1.5, 0.42, 0.05]} />
      <Headlight position={[0.68, 0.85, 1.9]} />
      <Headlight position={[-0.68, 0.85, 1.9]} />

      <RoundedBox args={[1.6, 0.1, 2.55]} radius={0.03} position={[0, 0.55, -0.85]}>
        <meshStandardMaterial color={palette.bodyDeep} roughness={0.5} metalness={0.3} />
      </RoundedBox>
      <Panel position={[-0.84, 1.02, -0.85]} size={[0.06, 0.62, 2.55]} />
      <Panel position={[0.84, 1.02, -0.85]} size={[0.06, 0.62, 2.55]} />
      <Panel position={[0, 1.02, 0.4]} size={[1.62, 0.62, 0.06]} />
      <Panel position={[0, 0.98, -2.1]} size={[1.56, 0.5, 0.06]} />
      <Panel position={[-0.8, 0.72, -0.85]} size={[0.03, 0.22, 2.6]} />
      <Panel position={[0.8, 0.72, -0.85]} size={[0.03, 0.22, 2.6]} />

      <Wheel position={[0.9, 0.4, 1.7]} radius={0.4} />
      <Wheel position={[-0.9, 0.4, 1.7]} radius={0.4} />
      <Wheel position={[0.9, 0.4, -2.6]} radius={0.4} />
      <Wheel position={[-0.9, 0.4, -2.6]} radius={0.4} />
    </group>
  );
}

function Tempo({ color }: { color: string }) {
  return (
    <group scale={1.02}>
      <RoundedBox args={[1.62, 1.28, 2.2]} radius={0.1} smoothness={2} position={[0, 1.18, -0.7]}>
        <meshStandardMaterial color={palette.bodyAlt} roughness={0.3} metalness={0.25} />
      </RoundedBox>
      <RoundedBox args={[1.5, 1.22, 1.15]} radius={0.12} smoothness={2} position={[0, 1.08, 0.9]}>
        <meshStandardMaterial color={color} roughness={0.34} metalness={0.28} />
      </RoundedBox>
      <Glass position={[0, 1.5, 1.48]} size={[1.32, 0.4, 0.05]} />
      <Headlight position={[0.6, 0.95, 1.62]} />
      <Headlight position={[-0.6, 0.95, 1.62]} />
      <Panel position={[0.82, 1.2, -0.7]} size={[0.03, 0.75, 2.1]} />
      <Panel position={[-0.82, 1.2, -0.7]} size={[0.03, 0.75, 2.1]} />
      <Panel position={[0, 0.62, -0.7]} size={[1.5, 0.12, 2.0]} />

      <Wheel position={[0.78, 0.4, -1.75]} radius={0.38} width={0.22} />
      <Wheel position={[-0.78, 0.4, -1.75]} radius={0.38} width={0.22} />
      <Wheel position={[0, 0.38, 0.95]} radius={0.34} width={0.18} />
    </group>
  );
}

function DeliveryVan({ color }: { color: string }) {
  return (
    <group scale={1.05}>
      <RoundedBox args={[1.95, 1.8, 4.3]} radius={0.26} smoothness={3} position={[0, 1.28, 0]}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <Glass position={[0, 1.9, 2.12]} size={[1.6, 0.46, 0.08]} />
      <RoundedBox args={[1.82, 0.3, 0.5]} radius={0.08} position={[0, 0.52, 2.25]}>
        <meshStandardMaterial color={palette.chassis} roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <Headlight position={[0.78, 1.08, 2.3]} />
      <Headlight position={[-0.78, 1.08, 2.3]} />
      <Panel position={[0.98, 1.42, -0.4]} size={[0.03, 1.1, 0.04]} />
      <Panel position={[-0.98, 1.42, -0.4]} size={[0.03, 1.1, 0.04]} />
      <Panel position={[0.99, 0.55, -1.4]} size={[0.04, 0.14, 0.5]} />
      <Panel position={[-0.99, 0.55, -1.4]} size={[0.04, 0.14, 0.5]} />
      <mesh position={[0.15, 2.24, 0.7]}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
        <meshStandardMaterial color={palette.chassis} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.15, 2.24, -0.3]}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
        <meshStandardMaterial color={palette.chassis} roughness={0.5} metalness={0.4} />
      </mesh>

      <Wheel position={[0.97, 0.42, 1.75]} />
      <Wheel position={[-0.97, 0.42, 1.75]} />
      <Wheel position={[0.97, 0.42, -1.7]} />
      <Wheel position={[-0.97, 0.42, -1.7]} />
    </group>
  );
}

interface VehicleModelProps {
  type: VehicleType;
  color?: string;
}

const defaultColors: Record<VehicleType, string> = {
  'heavy-truck': '#3d4a63',
  'mini-truck': '#3e5a63',
  tempo: '#4a3e63',
  'delivery-van': '#3e634f',
};

/**
 * Procedural, low-poly commercial vehicle models.
 * Preferred over external GLTF assets: no network fetch, tiny bundle, all models
 * grounded at y=0 (wheel tread at the floor) for consistent staging.
 */
export default function VehicleModel({ type, color }: VehicleModelProps) {
  const body = color ?? defaultColors[type];
  return (
    <group position={[0, 0, 0]}>
      {type === 'heavy-truck' && <HeavyTruck color={body} />}
      {type === 'mini-truck' && <MiniTruck color={body} />}
      {type === 'tempo' && <Tempo color={body} />}
      {type === 'delivery-van' && <DeliveryVan color={body} />}
    </group>
  );
}

export type VehicleGroupHandle = Group;