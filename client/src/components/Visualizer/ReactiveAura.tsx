/**
 * @file ReactiveAura.tsx
 * @description Compact, ethereal nebular core at the heart of the galaxy.
 * Gently breathes with the tempo and energy of the music.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReactiveAuraProps {
  tempo: number;
  energy: number;
  valenceColor: THREE.Color;
}

export const ReactiveAura: React.FC<ReactiveAuraProps> = ({
  tempo,
  energy,
  valenceColor
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    const bps = (tempo || 120) / 60;
    const pulse = 1.0 + Math.sin(t * Math.PI * 2 * bps) * (0.04 + energy * 0.06);

    meshRef.current.scale.set(pulse, pulse, pulse);
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z += 0.001;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* Sleek, compact nebular core */}
      <sphereGeometry args={[2.8, 32, 32]} />
      <meshBasicMaterial
        color={valenceColor}
        transparent
        opacity={0.05 + energy * 0.03}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export default ReactiveAura;
