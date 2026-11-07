/**
 * @file ConstellationCanvas.tsx
 * @description Full-screen WebGL Canvas with refined, intimate camera parameters.
 */

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ConstellationScene } from './ConstellationScene';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { useStore } from '../../store/useStore';

export const ConstellationCanvas: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const cinematicCamera = useStore((state) => state.cinematicCamera);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#020308] z-0">
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 2.5, 9.5], fov: 50, near: 0.1, far: 500 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
        >
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            maxDistance={35}
            minDistance={1.5}
            enabled={!cinematicCamera}
          />
          <ConstellationScene controlsRef={controlsRef} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};

export default ConstellationCanvas;
