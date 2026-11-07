/**
 * @file FloatingLyricText.tsx
 * @description High-contrast, razor-sharp 3D floating typography.
 * Rendered in solid luminous white with a dark cosmic stroke for maximum readability.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ConstellationStarNode } from '../../types';

interface FloatingLyricTextProps {
  activeNode: ConstellationStarNode | null;
  valenceColor: THREE.Color;
}

const _targetScale = new THREE.Vector3(1, 1, 1);
const _initialScale = new THREE.Vector3(0.65, 0.65, 0.65);

export const FloatingLyricText: React.FC<FloatingLyricTextProps> = ({
  activeNode,
  valenceColor
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const [displayText, setDisplayText] = useState<string>('');
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (activeNode && activeNode.text) {
      setDisplayText(activeNode.text);
      // Place delicately 0.45 units above the star node
      targetPosRef.current.set(
        activeNode.position[0],
        activeNode.position[1] + 0.45,
        activeNode.position[2]
      );
      // Micro-bounce scale transition on lyric line change
      if (groupRef.current) {
        groupRef.current.scale.copy(_initialScale);
      }
    } else {
      setDisplayText('');
    }
  }, [activeNode]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const safeDelta = Math.min(delta, 0.1);

    if (activeNode) {
      groupRef.current.position.lerp(targetPosRef.current, safeDelta * 6.0);
      groupRef.current.scale.lerp(_targetScale, safeDelta * 8.0);
    }
  });

  if (!displayText) return null;

  // Responsive typography: strictly constrained so lyrics never escape the screen
  const textLength = displayText.length;
  const responsiveMaxWidth = Math.min(Math.max(viewport.width * 0.7, 2.5), 4.8);

  let responsiveFontSize = 0.32;
  if (textLength > 80) {
    responsiveFontSize = 0.20;
  } else if (textLength > 50) {
    responsiveFontSize = 0.24;
  } else if (textLength > 30) {
    responsiveFontSize = 0.28;
  }

  return (
    <group ref={groupRef}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Soft Cosmic Depth Shadow */}
        <Text
          position={[0, -0.015, -0.01]}
          fontSize={responsiveFontSize}
          maxWidth={responsiveMaxWidth}
          letterSpacing={0.03}
          lineHeight={1.35}
          textAlign="center"
          anchorX="center"
          anchorY="bottom"
          color="#000000"
          fillOpacity={0.8}
        >
          {displayText}
        </Text>

        {/* Crisp, 100% Solid Ultra-White Text with Protective Cosmic Stroke */}
        <Text
          position={[0, 0, 0]}
          fontSize={responsiveFontSize}
          maxWidth={responsiveMaxWidth}
          letterSpacing={0.03}
          lineHeight={1.35}
          textAlign="center"
          anchorX="center"
          anchorY="bottom"
          color="#ffffff"
          fillOpacity={1.0}
          outlineWidth={0.014}
          outlineColor="#020308"
          outlineBlur={0.006}
        >
          {displayText}
        </Text>
      </Billboard>
    </group>
  );
};

export default FloatingLyricText;
