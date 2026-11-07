/**
 * @file constellationMath.ts
 * @description Computes 3D celestial coordinates for lyrics across multiple
 * aesthetic geometric presets: 'spiral', 'ring', and 'sphere'.
 */

import { LyricLine, ConstellationStarNode, AudioFeatures, ConstellationShape } from '../types';

export function generateConstellationStars(
  lyrics: LyricLine[],
  totalDurationSec: number = 180,
  shape: ConstellationShape = 'spiral'
): ConstellationStarNode[] {
  if (!lyrics || !Array.isArray(lyrics) || lyrics.length === 0) return [];

  const duration = typeof totalDurationSec === 'number' && !isNaN(totalDurationSec) && totalDurationSec > 0
    ? Math.max(totalDurationSec, 30)
    : 180;
  const count = lyrics.length;

  return lyrics.map((lyric, index) => {
    const safeTime = typeof lyric.time === 'number' && !isNaN(lyric.time) ? Math.max(0, lyric.time) : 0;
    const normalizedTime = Math.min(1, Math.max(0, safeTime / duration));

    let x = 0;
    let y = 0;
    let z = 0;

    if (shape === 'ring') {
      // Celestial Stargate / Orbital Ring
      const angle = (index / count) * Math.PI * 2;
      const radius = 5.2 + Math.sin(index * 1.5) * 0.4;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = Math.sin(angle * 3) * 0.8 + Math.cos(index * 2) * 0.2;
    } else if (shape === 'sphere') {
      // Supernova Planetary Sphere (Fibonacci spiral on sphere surface)
      const phi = Math.acos(1 - (2 * (index + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const radius = 4.8 + Math.sin(index * 0.8) * 0.3;

      x = radius * Math.sin(phi) * Math.cos(theta);
      y = radius * Math.cos(phi) * 0.85;
      z = radius * Math.sin(phi) * Math.sin(theta);
    } else {
      // Default: Elegant Archimedean Galactic Helix
      const turns = 2.4;
      const angle = normalizedTime * Math.PI * 2 * turns;
      const baseRadius = 4.2 + normalizedTime * 3.6;
      const microVariation = Math.sin(index * 0.9) * 0.8;
      const radius = baseRadius + microVariation;

      x = Math.cos(angle) * radius + Math.sin(index * 1.5) * 0.4;
      z = Math.sin(angle) * radius + Math.cos(index * 1.2) * 0.4;

      const yElevation = (normalizedTime - 0.5) * 4.5;
      const yWave = Math.sin(normalizedTime * Math.PI * 3) * 1.2;
      y = yElevation + yWave;
    }

    return {
      index,
      time: lyric.time,
      text: lyric.text,
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))]
    };
  });
}

export function generateAudioReactiveNodes(
  durationSec: number = 180,
  features: AudioFeatures | null,
  shape: ConstellationShape = 'spiral'
): ConstellationStarNode[] {
  const safeDuration = typeof durationSec === 'number' && !isNaN(durationSec) && durationSec > 0
    ? Math.max(30, durationSec)
    : 180;
  const tempo = typeof features?.tempo === 'number' && !isNaN(features.tempo) ? features.tempo : 120;
  const energy = typeof features?.energy === 'number' && !isNaN(features.energy) ? features.energy : 0.6;
  const key = typeof features?.key === 'number' && !isNaN(features.key) ? features.key : 0;

  const nodeCount = Math.min(32, Math.max(16, Math.round((safeDuration / 60) * 7 * (0.8 + energy * 0.3))));
  const nodes: ConstellationStarNode[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const time = (i / nodeCount) * safeDuration;
    const progress = i / nodeCount;

    let x = 0;
    let y = 0;
    let z = 0;

    if (shape === 'ring') {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 5.0 + Math.sin(i * 1.2) * 0.3;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = Math.sin(angle * 2.5 + (tempo / 60)) * 0.9;
    } else if (shape === 'sphere') {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 4.5;
      x = radius * Math.sin(phi) * Math.cos(theta);
      y = radius * Math.cos(phi);
      z = radius * Math.sin(phi) * Math.sin(theta);
    } else {
      const angle = progress * Math.PI * 2 * (1.8 + (key % 3) * 0.2);
      const radius = 3.8 + progress * 4.0;
      x = Math.cos(angle) * radius + Math.sin(i * 1.2) * 0.5;
      z = Math.sin(angle) * radius + Math.cos(i * 1.5) * 0.5;
      y = Math.sin(progress * Math.PI * 2.5 + (tempo / 60)) * 1.8 + (progress - 0.5) * 3.5;
    }

    nodes.push({
      index: i,
      time,
      text: `Harmonic Pulse #${i + 1} [${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}]`,
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))]
    });
  }

  return nodes;
}
