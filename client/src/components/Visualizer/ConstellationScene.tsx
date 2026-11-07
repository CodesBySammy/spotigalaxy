/**
 * @file ConstellationScene.tsx
 * @description Master 3D scene assembler connecting geometric modes, nodes,
 * lines, text, shooting comets, lights, and camera.
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { InstancedStars } from './InstancedStars';
import { ConstellationLines } from './ConstellationLines';
import { FloatingLyricText } from './FloatingLyricText';
import { CosmicDustField } from './CosmicDustField';
import { ReactiveAura } from './ReactiveAura';
import { CameraController } from './CameraController';
import { ShootingStars } from './ShootingStars';
import {
  generateConstellationStars,
  generateAudioReactiveNodes
} from '../../utils/constellationMath';
import { getDynamicSongTheme } from '../../utils/colorUtils';

interface ConstellationSceneProps {
  controlsRef: React.RefObject<any>;
}

export const ConstellationScene: React.FC<ConstellationSceneProps> = ({ controlsRef }) => {
  const currentTrack = useStore((state) => state.currentTrack);
  const audioFeatures = useStore((state) => state.audioFeatures);
  const lyrics = useStore((state) => state.lyrics);
  const activeLyricIndex = useStore((state) => state.activeLyricIndex);
  const audioReactiveMode = useStore((state) => state.audioReactiveMode);
  const cinematicCamera = useStore((state) => state.cinematicCamera);
  const constellationShape = useStore((state) => state.constellationShape);

  const durationSec = (currentTrack?.durationMs ?? 180000) / 1000;
  const energy = audioFeatures?.energy ?? 0.5;
  const tempo = audioFeatures?.tempo ?? 120;

  // Compute 3D star nodes using the chosen geometric mode ('spiral', 'ring', or 'sphere')
  const nodes = useMemo(() => {
    if (audioReactiveMode || !lyrics || lyrics.length === 0) {
      return generateAudioReactiveNodes(durationSec, audioFeatures, constellationShape);
    }
    return generateConstellationStars(lyrics, durationSec, constellationShape);
  }, [lyrics, durationSec, audioFeatures, audioReactiveMode, constellationShape]);

  // Determine active star node - only updates when lyric line changes, NOT 60fps!
  const activeNode = useMemo(() => {
    if (nodes.length === 0) return null;
    if (activeLyricIndex >= 0 && activeLyricIndex < nodes.length) {
      return nodes[activeLyricIndex];
    }
    return null;
  }, [nodes, activeLyricIndex]);

  // Real-time dynamic song-signature celestial colors (updates with active lyric progression, 0 lag!)
  const { primaryThreeColor, secondaryThreeColor } = useMemo(() => {
    const totalLines = Math.max(1, nodes.length);
    const progress = activeLyricIndex >= 0 ? activeLyricIndex / totalLines : 0;
    const curTime = useStore.getState().currentTime;
    return getDynamicSongTheme(currentTrack, progress, curTime, tempo, energy);
  }, [currentTrack, activeLyricIndex, nodes.length, tempo, energy]);

  return (
    <>
      {/* Refined Galaxy Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[15, 20, 15]} intensity={0.7} />
      <directionalLight position={[-15, -10, -15]} intensity={0.35} color={secondaryThreeColor} />
      <pointLight position={[0, 0, 0]} intensity={1.8 + energy * 1.5} color={primaryThreeColor} distance={30} />

      {/* Atmospheric Starfield, Core Nebula, and Shooting Stars */}
      <CosmicDustField energy={energy} valenceColor={primaryThreeColor} />
      <ReactiveAura tempo={tempo} energy={energy} valenceColor={primaryThreeColor} />
      <ShootingStars />

      {/* Single GPU Draw Call Instanced Stars (reads clock in useFrame, 0 lag) */}
      <InstancedStars
        nodes={nodes}
        activeNode={activeNode}
        valenceColor={primaryThreeColor}
        energy={energy}
      />

      {/* Filament Lines (updates only when active star changes, 0 lag) */}
      <ConstellationLines
        nodes={nodes}
        activeNodeIndex={activeNode ? activeNode.index : -1}
        valenceColor={primaryThreeColor}
        energy={energy}
      />

      {/* Floating 3D Lyric Billboard */}
      <FloatingLyricText activeNode={activeNode} valenceColor={primaryThreeColor} />

      {/* Cinematic Camera Rig */}
      <CameraController
        activeNode={activeNode}
        cinematicEnabled={cinematicCamera}
        controlsRef={controlsRef}
      />
    </>
  );
};

export default ConstellationScene;
