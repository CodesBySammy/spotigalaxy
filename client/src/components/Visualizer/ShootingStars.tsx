/**
 * @file ShootingStars.tsx
 * @description Periodic cosmic shooting stars and comets streaking through deep space.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Comet {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export const ShootingStars: React.FC = () => {
  const lineRef = useRef<THREE.LineSegments>(null);
  const count = 4;
  const cometsRef = useRef<Comet[]>([]);

  // Initialize comet pool
  if (cometsRef.current.length === 0) {
    for (let i = 0; i < count; i++) {
      cometsRef.current.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.2
      });
    }
  }

  const positions = useRef(new Float32Array(count * 6)); // 2 vertices per comet line

  useFrame((_, delta) => {
    if (!lineRef.current) return;

    cometsRef.current.forEach((comet, idx) => {
      if (!comet.active) {
        // Random chance to ignite shooting star
        if (Math.random() < 0.008) {
          comet.active = true;
          comet.life = 0;
          comet.maxLife = 0.8 + Math.random() * 0.8;

          // Spawn in outer bounds
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnRadius = 18 + Math.random() * 8;
          comet.position.set(
            Math.cos(spawnAngle) * spawnRadius,
            (Math.random() - 0.5) * 12 + 4,
            Math.sin(spawnAngle) * spawnRadius
          );

          // Fast diagonal velocity across the sky
          comet.velocity.set(
            (Math.random() - 0.5) * 25,
            -10 - Math.random() * 15,
            (Math.random() - 0.5) * 25
          );
        }
      } else {
        comet.life += delta;
        if (comet.life >= comet.maxLife) {
          comet.active = false;
        } else {
          // Advance head position
          comet.position.addScaledVector(comet.velocity, delta);
        }
      }

      const i6 = idx * 6;
      if (comet.active) {
        const tailLength = 0.08;
        // Head
        positions.current[i6] = comet.position.x;
        positions.current[i6 + 1] = comet.position.y;
        positions.current[i6 + 2] = comet.position.z;
        // Tail
        positions.current[i6 + 3] = comet.position.x - comet.velocity.x * tailLength;
        positions.current[i6 + 4] = comet.position.y - comet.velocity.y * tailLength;
        positions.current[i6 + 5] = comet.position.z - comet.velocity.z * tailLength;
      } else {
        // Hide off-screen
        positions.current[i6] = 0;
        positions.current[i6 + 1] = -999;
        positions.current[i6 + 2] = 0;
        positions.current[i6 + 3] = 0;
        positions.current[i6 + 4] = -999;
        positions.current[i6 + 5] = 0;
      }
    });

    const attr = lineRef.current.geometry?.attributes?.position as THREE.BufferAttribute | undefined;
    if (attr) {
      attr.copyArray(positions.current);
      attr.needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count * 2}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#c084fc"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export default ShootingStars;

