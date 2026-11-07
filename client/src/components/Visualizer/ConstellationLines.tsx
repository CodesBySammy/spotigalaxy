/**
 * @file ConstellationLines.tsx
 * @description Whisper-thin, glowing celestial filaments connecting lyric star nodes.
 * Rendered with minimalist delicacy and aesthetic galactic elegance.
 */

import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { ConstellationStarNode } from '../../types';

interface ConstellationLinesProps {
  nodes: ConstellationStarNode[];
  activeNodeIndex: number;
  valenceColor: THREE.Color;
  energy: number;
}

export const ConstellationLines: React.FC<ConstellationLinesProps> = ({
  nodes,
  activeNodeIndex,
  valenceColor,
  energy
}) => {
  // Pre-instantiate Vector3 instances once per node set to avoid GC churn
  const nodeVectors = useMemo(() => {
    return (nodes || []).map((n) => new THREE.Vector3(...n.position));
  }, [nodes]);

  // Only recomputes when the active lyric index advances (every few seconds), NOT 60fps!
  const activeSegments = useMemo(() => {
    if (!nodes || nodes.length < 2 || nodeVectors.length < 2 || activeNodeIndex < 1) return [];

    const segments: Array<{
      points: [THREE.Vector3, THREE.Vector3];
      isLatest: boolean;
    }> = [];

    const count = Math.min(activeNodeIndex, nodes.length - 1);
    for (let i = 0; i < count; i++) {
      const isLatest = i === count - 1;
      segments.push({
        points: [nodeVectors[i], nodeVectors[i + 1]],
        isLatest
      });
    }

    return segments;
  }, [nodes, nodeVectors, activeNodeIndex]);

  if (activeSegments.length === 0) return null;

  const hexColor = valenceColor && typeof valenceColor.getHexString === 'function'
    ? `#${valenceColor.getHexString()}`
    : '#38bdf8';

  return (
    <group>
      {activeSegments.map((segment, idx) => (
        <Line
          key={`constellation-line-${idx}`}
          points={segment.points}
          color={segment.isLatest ? '#f8fafc' : hexColor}
          lineWidth={segment.isLatest ? 1.4 : 0.9}
          transparent
          opacity={segment.isLatest ? 0.95 : 0.55}
        />
      ))}
    </group>
  );
};

export default ConstellationLines;
