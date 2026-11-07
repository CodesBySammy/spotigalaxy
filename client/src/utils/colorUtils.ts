/**
 * @file colorUtils.ts
 * @description Dynamic Celestial Chromatic Engine.
 * Features vibrant, noticeable color morphing throughout the course of a single song,
 * combining macro song progression with harmonic rhythmic color cycling.
 */

import * as THREE from 'three';
import { SpotifyTrack } from '../types';

// Vibrant, highly-saturated celestial colors for high-contrast visual delight
export const NEBULAR_COLORS = [
  '#06b6d4', // 0: Electric Cyan
  '#3b82f6', // 1: Hyper Blue
  '#8b5cf6', // 2: Vivid Violet
  '#d946ef', // 3: Radiant Fuchsia
  '#f43f5e', // 4: Supernova Rose
  '#f59e0b', // 5: Solar Amber
  '#10b981', // 6: Aurora Emerald
  '#ec4899', // 7: Hot Pink
  '#6366f1', // 8: Cosmic Indigo
  '#14b8a6'  // 9: Aqua Marine
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Reusable scratch objects for zero-allocation color interpolation
const _scratchC1 = new THREE.Color();
const _scratchC2 = new THREE.Color();

/**
 * Linearly interpolates two hex colors in sRGB space without garbage collection overhead.
 */
export function lerpHex(hex1: string, hex2: string, t: number): string {
  _scratchC1.set(hex1);
  _scratchC2.set(hex2);
  _scratchC1.lerp(_scratchC2, Math.max(0, Math.min(1, t)));
  return `#${_scratchC1.getHexString()}`;
}

/**
 * Returns a distinct 6-color celestial progression for a track.
 */
export function getTrackColorSequence(track: SpotifyTrack | null): string[] {
  if (!track) {
    return ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  }

  const key = `${track.id || ''}:${track.name || ''}:${track.primaryArtist || ''}`;
  const seed = hashString(key);
  const len = NEBULAR_COLORS.length;

  // Pick 6 distinct, harmonious stops around the color wheel based on the song's seed
  const sequence: string[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = (seed + i * 2) % len;
    sequence.push(NEBULAR_COLORS[idx]);
  }
  return sequence;
}

export interface DynamicSongTheme {
  primaryColor: string;
  secondaryColor: string;
  primaryThreeColor: THREE.Color;
  secondaryThreeColor: THREE.Color;
  vibeGlow: string;
  pulseDuration: string;
}

/**
 * Computes vibrant, visibly changing colors over the course of a single song.
 * Changes noticeably through different color phases as the song plays!
 */
export function getDynamicSongTheme(
  track: SpotifyTrack | null,
  progressRatio: number = 0,
  currentTimeSec: number = 0,
  tempo: number = 120,
  energy: number = 0.5
): DynamicSongTheme {
  const sequence = getTrackColorSequence(track);
  const numStops = sequence.length;

  // Macro progress: 0.0 to 1.0 across the full song
  const p = Math.max(0, Math.min(1, progressRatio));

  // Micro wave: adds a gentle 18-second undulating shift so colors visibly morph continuously
  const wave = (Math.sin(currentTimeSec * (Math.PI * 2 / 20)) + 1) * 0.5; // 0 to 1 over 20s

  // Combined position in the color sequence
  // Moves through the sequence across the song, enhanced by the micro wave
  const continuousIndex = (p * (numStops - 1) + wave * 0.6) % numStops;
  const baseIdx = Math.floor(continuousIndex);
  const nextIdx = (baseIdx + 1) % numStops;
  const factor = continuousIndex - baseIdx;

  const primaryColor = lerpHex(sequence[baseIdx], sequence[nextIdx], factor);

  // Secondary color is offset by 2 stops for high-contrast dual-tone gradient
  const secBaseIdx = (baseIdx + 2) % numStops;
  const secNextIdx = (secBaseIdx + 1) % numStops;
  const secondaryColor = lerpHex(sequence[secBaseIdx], sequence[secNextIdx], factor);

  const primaryThreeColor = new THREE.Color(primaryColor);
  const secondaryThreeColor = new THREE.Color(secondaryColor);

  const safeTempo = Math.max(60, Math.min(200, tempo || 120));
  const safeEnergy = Math.max(0.1, Math.min(1.0, energy || 0.5));
  const beatDuration = 60 / safeTempo;
  const pulseDuration = `${(beatDuration * (1.4 - safeEnergy * 0.3)).toFixed(2)}s`;

  const glowAlpha = 0.3 + safeEnergy * 0.2;
  const vibeGlow = `rgba(${Math.round(primaryThreeColor.r * 255)}, ${Math.round(primaryThreeColor.g * 255)}, ${Math.round(primaryThreeColor.b * 255)}, ${glowAlpha})`;

  return {
    primaryColor,
    secondaryColor,
    primaryThreeColor,
    secondaryThreeColor,
    vibeGlow,
    pulseDuration
  };
}

// Backwards compatibility
export function getValenceColor(valence: number = 0.5): string {
  const t = Math.max(0, Math.min(1, valence));
  if (t < 0.5) return lerpHex('#06b6d4', '#8b5cf6', t * 2);
  return lerpHex('#8b5cf6', '#f43f5e', (t - 0.5) * 2);
}

export function getValenceThreeColor(valence: number = 0.5): THREE.Color {
  return new THREE.Color(getValenceColor(valence));
}

export function getPulseDuration(tempo: number = 120, energy: number = 0.5): string {
  const safeTempo = Math.max(60, Math.min(220, tempo || 120));
  const safeEnergy = Math.max(0.1, Math.min(1.0, energy || 0.5));
  return `${((60 / safeTempo) * (1.5 - safeEnergy * 0.4)).toFixed(2)}s`;
}

export function getGlowWithAlpha(colorStr: string, alpha: number = 0.18): string {
  const temp = new THREE.Color(colorStr);
  return `rgba(${Math.round(temp.r * 255)}, ${Math.round(temp.g * 255)}, ${Math.round(temp.b * 255)}, ${alpha})`;
}
