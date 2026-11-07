/**
 * @file CameraController.tsx
 * @description Smooth, intimate cinematic camera tracking.
 * Lerps gracefully around compact celestial star nodes for an aesthetic galaxy feel.
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ConstellationStarNode } from '../../types';

interface CameraControllerProps {
  activeNode: ConstellationStarNode | null;
  cinematicEnabled: boolean;
  controlsRef: React.RefObject<any>;
}

// Scratch vector hoisted outside render loop for zero-allocation garbage collection
const _ORIGIN_VEC = new THREE.Vector3(0, 0, 0);

export const CameraController: React.FC<CameraControllerProps> = ({
  activeNode,
  cinematicEnabled,
  controlsRef
}) => {
  const { camera } = useThree();
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, 11));

  useFrame((state, delta) => {
    if (!cinematicEnabled) return;

    // Guard against huge delta after tab suspension/switch
    const safeDelta = Math.min(delta, 0.1);

    if (activeNode && Array.isArray(activeNode.position)) {
      const [nx, ny, nz] = activeNode.position;
      if (typeof nx === 'number' && typeof ny === 'number' && typeof nz === 'number') {
        // Intimate, sleek framing distance
        const distance = 3.6;
        targetCamPos.current.set(nx + distance * 0.65, ny + distance * 0.35, nz + distance * 0.8);
        targetLookAt.current.set(nx, ny + 0.15, nz);

        camera.position.lerp(targetCamPos.current, safeDelta * 1.5);

        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetLookAt.current, safeDelta * 2.0);
          controlsRef.current.update();
        } else {
          camera.lookAt(targetLookAt.current);
        }
      }
    } else {
      // Idle gentle rotation around compact galaxy core
      const time = state.clock.getElapsedTime() * 0.08;
      const radius = 10.5;
      targetCamPos.current.set(
        Math.sin(time) * radius,
        2.5 + Math.cos(time * 0.6) * 1.2,
        Math.cos(time) * radius
      );
      camera.position.lerp(targetCamPos.current, safeDelta * 1.0);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(_ORIGIN_VEC, safeDelta * 1.2);
        controlsRef.current.update();
      }
    }
  });

  return null;
};

export default CameraController;
