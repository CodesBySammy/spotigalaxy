/**
 * @file types/index.ts
 * @description Core TypeScript interfaces for Lyrical Constellation.
 */

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  primaryArtist: string;
  album: string;
  albumArt: string;
  durationMs: number;
  externalUrl?: string | null;
}

export interface AudioFeatures {
  valence: number;         // 0.0 (sad/dark) to 1.0 (happy/bright)
  energy: number;          // 0.0 to 1.0 (intensity, loudness)
  tempo: number;           // BPM (e.g. 128.0)
  danceability: number;    // 0.0 to 1.0
  acousticness: number;    // 0.0 to 1.0
  instrumentalness: number;// 0.0 to 1.0
  key: number;             // Pitch class notation
  mode: number;            // 1 = Major, 0 = Minor
}

export interface LyricLine {
  time: number;  // Time offset in seconds (e.g. 14.52)
  text: string;  // Lyric line text
}

export interface LyricsPayload {
  synced: boolean;
  instrumental: boolean;
  notFound: boolean;
  lyrics: LyricLine[];
  plainLyrics?: string;
}

export interface PlaybackResponse {
  isPlaying: boolean;
  progressMs: number;
  timestamp: number;
  track: SpotifyTrack | null;
  audioFeatures: AudioFeatures | null;
  message?: string;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  email?: string;
  images?: Array<{ url: string; height?: number; width?: number }>;
  product?: string;
}

export type ConstellationShape = 'spiral' | 'ring' | 'sphere';

export interface ConstellationStarNode {
  index: number;
  time: number;
  text: string;
  position: [number, number, number];
}

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

