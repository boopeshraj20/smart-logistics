import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import VehicleModel from './VehicleModel';
import { type VehicleType } from '@/types';

interface VehicleStageProps {
  type: VehicleType;
  color?: string;
  rotateSpeed?: number;
  interactive?: boolean;
  className?: string;
}

/**
 * Reusable 3D staging area: camera, studio lighting, soft ground shadow and an
 * auto-rotating turntable view with drag-to-inspect (OrbitControls).
 *
 * Kept transparent so it can sit inside glass cards; `rotateSpeed` responds to
 * hover state passed by the parent card component.
 */
export default function VehicleStage({
  type,
  color,
  rotateSpeed = 0.7,
  interactive = true,
  className,
}: VehicleStageProps) {
  const controls = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    if (controls.current) controls.current.autoRotateSpeed = rotateSpeed;
  }, [rotateSpeed]);

  return (
    <div className={className ?? 'h-44 w-full'}>
      <Canvas
        camera={{ position: [0, 2.6, 7.6], fov: 34 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        resize={{ debounce: 0 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <directionalLight position={[5, 8, 4]} intensity={1.7} color="#e8efff" />
          <directionalLight position={[-5, 4, -5]} intensity={0.5} color="#8b7cf6" />
          <spotLight position={[0, 7, 2]} intensity={1.1} angle={0.5} penumbra={0.6} color="#dfe8ff" />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
            <circleGeometry args={[5.2, 48]} />
            <meshStandardMaterial color="#05070d" roughness={0.95} metalness={0} />
          </mesh>

          <group rotation={[0, -0.35, 0]}>
            <VehicleModel type={type} color={color} />
          </group>

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.55}
            scale={11}
            blur={2.2}
            far={4}
            resolution={256}
            color="#000000"
          />

          <OrbitControls
            ref={(c) => {
              controls.current = c;
            }}
            autoRotate
            autoRotateSpeed={rotateSpeed}
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 2.05}
            rotateSpeed={0.7}
            enabled={interactive}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}