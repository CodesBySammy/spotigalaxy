/**
 * @file InstancedStars.tsx
 * @description Production-grade GPU InstancedMesh renderer for celestial star nodes.
 * Renders all constellation stars in a SINGLE GPU draw call (1 draw call vs 80),
 * supporting harmonic floating, dynamic color states, and raycasted hover inspection.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ConstellationStarNode } from '../../types';
import { useStore } from '../../store/useStore';

interface InstancedStarsProps {
  nodes: ConstellationStarNode[];
  activeNode: ConstellationStarNode | null;
  valenceColor: THREE.Color;
  energy: number;
}

// Reusable scratch objects hoisted outside render loops for zero-allocation
const _dummyMatrix = new THREE.Matrix4();
const _dummyPosition = new THREE.Vector3();
const _dummyScale = new THREE.Vector3();
const _dummyColor = new THREE.Color();
const _COLOR_MUTED = new THREE.Color('#475569');
const _COLOR_HOVER = new THREE.Color('#38bdf8');
const _COLOR_WHITE = new THREE.Color('#ffffff');

export const InstancedStars: React.FC<InstancedStarsProps> = ({
  nodes,
  activeNode,
  valenceColor,
  energy
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const hoveredStarIndex = useStore((state) => state.hoveredStarIndex);
  const setHoveredStarIndex = useStore((state) => state.setHoveredStarIndex);

  const count = nodes.length;

  // Shared star sphere geometry (tiny, crisp, radius 0.08)
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.08, 16, 16), []);
  const starMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.15,
        metalness: 0.9,
        toneMapped: false
      }),
    []
  );

  // Initialize instance colors once nodes are generated
  useEffect(() => {
    if (!meshRef.current || count === 0) return;

    for (let i = 0; i < count; i++) {
      meshRef.current.setColorAt(i, _COLOR_MUTED);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, nodes]);

  // Clean up GPU allocations and reset cursor style on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
      sphereGeo.dispose();
      starMaterial.dispose();
    };
  }, [sphereGeo, starMaterial]);

  useFrame(({ clock }) => {
    if (!meshRef.current || count === 0) return;

    const t = clock.getElapsedTime();
    const floatSpeed = 0.6 + energy * 0.3;
    const curTime = useStore.getState().currentTime;

    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      const isPassed = curTime >= node.time;
      const isActive = activeNode?.index === node.index;
      const isHovered = hoveredStarIndex === node.index;

      // Micro-harmonic float
      const phase = node.index * 0.45;
      const dy = Math.sin(t * floatSpeed + phase) * 0.08;
      const dx = Math.cos(t * floatSpeed * 0.7 + phase) * 0.05;

      _dummyPosition.set(node.position[0] + dx, node.position[1] + dy, node.position[2]);

      // Scale determination
      let s = 0.75;
      if (isActive) {
        s = 1.8;
      } else if (isHovered) {
        s = 1.45;
      } else if (isPassed) {
        s = 1.15;
      }

      _dummyScale.set(s, s, s);
      _dummyMatrix.makeTranslation(_dummyPosition.x, _dummyPosition.y, _dummyPosition.z);
      _dummyMatrix.scale(_dummyScale);

      meshRef.current.setMatrixAt(i, _dummyMatrix);

      // Color determination
      if (isActive) {
        _dummyColor.copy(_COLOR_WHITE);
      } else if (isHovered) {
        _dummyColor.copy(_COLOR_HOVER);
      } else if (isPassed) {
        _dummyColor.copy(valenceColor);
      } else {
        _dummyColor.copy(_COLOR_MUTED);
      }

      meshRef.current.setColorAt(i, _dummyColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    // Active Star Pulsing Halo Ring animation
    if (haloRef.current && activeNode) {
      const pulseScale = 1.0 + Math.sin(t * 4.5) * 0.2;
      haloRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      haloRef.current.rotation.z += 0.01;
    }
  });

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hoveredNode = hoveredStarIndex !== null ? nodes[hoveredStarIndex] : null;

  if (count === 0) return null;

  return (
    <group>
      {/* 1 Single GPU Draw Call for ALL Stars */}
      <instancedMesh
        key={`stars-${count}`}
        ref={meshRef}
        args={[sphereGeo, starMaterial, count]}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && e.instanceId < count) {
            setHoveredStarIndex(e.instanceId);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          setHoveredStarIndex(null);
          document.body.style.cursor = 'auto';
        }}
      />

      {/* Radiant Halo for Active Star */}
      {activeNode && (
        <mesh
          ref={haloRef}
          position={activeNode.position}
        >
          <ringGeometry args={[0.16, 0.22, 32]} />
          <meshBasicMaterial
            color={valenceColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Hologram inspection badge for hovered star */}
      {hoveredNode && hoveredNode.index !== activeNode?.index && (
        <group position={[hoveredNode.position[0], hoveredNode.position[1] + 0.35, hoveredNode.position[2]]}>
          <Billboard follow>
            <Text
              fontSize={0.17}
              maxWidth={3.5}
              textAlign="center"
              color="#38bdf8"
              anchorX="center"
              anchorY="bottom"
              lineHeight={1.3}
              letterSpacing={0.03}
              fillOpacity={1.0}
              outlineWidth={0.01}
              outlineColor="#020308"
            >
              {`[${formatMinSec(hoveredNode.time)}] ${hoveredNode.text}`}
            </Text>
          </Billboard>
        </group>
      )}
    </group>
  );
};

export default InstancedStars;

