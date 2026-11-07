/**
 * @file CosmicDustField.tsx
 * @description Fine-grain, aesthetic galactic stardust field.
 * Micro-pinpoint twinkling stars drifting in deep space with soft nebular tints.
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CosmicDustFieldProps {
  energy: number;
  valenceColor: THREE.Color;
}

export const CosmicDustField: React.FC<CosmicDustFieldProps> = ({
  energy,
  valenceColor
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1800;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spread = 40;

    // Galaxy chromatic stops: ice cyan, violet, and starlight white
    const palette = [
      new THREE.Color('#38bdf8'), // Ice Cyan
      new THREE.Color('#818cf8'), // Lavender
      new THREE.Color('#c084fc'), // Orchid
      new THREE.Color('#f8fafc'), // Pure Starlight
      new THREE.Color('#e2e8f0')  // Silver Dust
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * spread;
      pos[i3 + 1] = (Math.random() - 0.5) * spread * 0.7;
      pos[i3 + 2] = (Math.random() - 0.5) * spread;

      const pick = palette[Math.floor(Math.random() * palette.length)];
      col[i3] = pick.r;
      col[i3 + 1] = pick.g;
      col[i3 + 2] = pick.b;
    }

    return [pos, col];
  }, [valenceColor]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const safeDelta = Math.min(delta, 0.1);
    const rotSpeed = 0.01 + energy * 0.015;
    pointsRef.current.rotation.y += safeDelta * rotSpeed;
    pointsRef.current.rotation.x += safeDelta * (rotSpeed * 0.3);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045 + energy * 0.02}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default CosmicDustField;
