/**
 * @file useStore.ts
 * @description Centralized Zustand state management for Lyrical Constellation.
 */

import { create } from 'zustand';
import {
  SpotifyTrack,
  AudioFeatures,
  LyricLine,
  SpotifyUser,
  ToastMessage,
  LyricsPayload
} from '../types';

export type LyricsStatus = 'idle' | 'loading' | 'synced' | 'not_found' | 'instrumental' | 'error';

interface AppState {
  // Authentication & User
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  setAuth: (isAuthenticated: boolean, user: SpotifyUser | null) => void;

  // Spotify Playback State
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  audioFeatures: AudioFeatures | null;
  currentTime: number; // Synced playback time in seconds (float)
  lastServerProgressMs: number;
  lastServerTimestamp: number;

  // Lyrics State
  lyrics: LyricLine[];
  lyricsStatus: LyricsStatus;
  activeLyricIndex: number;
  audioReactiveMode: boolean;
  lyricOffsetMs: number; // Fine-tune latency compensation offset (default +220ms)
  setLyricOffsetMs: (val: number | ((prev: number) => number)) => void;

  // Visualization settings
  cinematicCamera: boolean;
  setCinematicCamera: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  constellationShape: 'spiral' | 'ring' | 'sphere';
  setConstellationShape: (shape: 'spiral' | 'ring' | 'sphere') => void;
  hoveredStarIndex: number | null;
  setHoveredStarIndex: (index: number | null) => void;

  // Toasts / Notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Actions
  updatePlayback: (
    isPlaying: boolean,
    progressMs: number,
    serverTimestamp: number,
    track: SpotifyTrack | null,
    audioFeatures: AudioFeatures | null
  ) => void;
  setCurrentTime: (time: number) => void;
  setLyrics: (payload: LyricsPayload) => void;
  setLyricsStatus: (status: LyricsStatus) => void;
  setActiveLyricIndex: (index: number) => void;
  setAudioReactiveMode: (enabled: boolean) => void;
  resetTrack: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  setAuth: (isAuthenticated, user) => set({ isAuthenticated, user }),

  isPlaying: false,
  currentTrack: null,
  audioFeatures: null,
  currentTime: 0,
  lastServerProgressMs: 0,
  lastServerTimestamp: 0,

  lyrics: [],
  lyricsStatus: 'idle',
  activeLyricIndex: -1,
  audioReactiveMode: false,
  lyricOffsetMs: 220,
  setLyricOffsetMs: (val) =>
    set((state) => ({
      lyricOffsetMs: typeof val === 'function' ? val(state.lyricOffsetMs) : val
    })),

  cinematicCamera: true,
  setCinematicCamera: (val) =>
    set((state) => ({
      cinematicCamera: typeof val === 'function' ? val(state.cinematicCamera) : val
    })),
  constellationShape: 'spiral',
  setConstellationShape: (constellationShape) => set({ constellationShape }),
  hoveredStarIndex: null,
  setHoveredStarIndex: (hoveredStarIndex) => set({ hoveredStarIndex }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id }]
    }));

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),

  updatePlayback: (isPlaying, progressMs, serverTimestamp, track, audioFeatures) => {
    const prevTrackId = get().currentTrack?.id;
    const newTrackId = track?.id;

    // Track changed!
    if (newTrackId && newTrackId !== prevTrackId) {
      set({
        isPlaying,
        currentTrack: track,
        audioFeatures,
        currentTime: progressMs / 1000,
        lastServerProgressMs: progressMs,
        lastServerTimestamp: serverTimestamp,
        lyricsStatus: 'loading',
        activeLyricIndex: -1
      });
    } else {
      // Same track playback update
      set({
        isPlaying,
        currentTrack: track,
        audioFeatures: audioFeatures || get().audioFeatures,
        lastServerProgressMs: progressMs,
        lastServerTimestamp: serverTimestamp
      });
    }
  },

  setCurrentTime: (time) => {
    const state = get();
    const lyrics = state.lyrics;

    // Apply perceptual lead offset (default +220ms) to ensure lyric highlights on vocal onset
    const effectiveTime = time + (state.lyricOffsetMs / 1000);

    // If lyrics are loaded, determine the current active lyric index
    let newIndex = -1;
    if (lyrics.length > 0) {
      // Find the latest lyric line where line.time <= effective playback time
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (effectiveTime >= lyrics[i].time) {
          newIndex = i;
          break;
        }
      }
    }

    set({
      currentTime: time,
      activeLyricIndex: newIndex
    });
  },

  setLyrics: (payload) => {
    if (payload.instrumental) {
      set({
        lyrics: [],
        lyricsStatus: 'instrumental',
        audioReactiveMode: true,
        activeLyricIndex: -1
      });
      get().addToast({
        title: 'Instrumental Track',
        message: 'This track is instrumental. Audio Reactive Constellation activated.',
        type: 'info'
      });
    } else if (payload.synced && payload.lyrics.length > 0) {
      set({
        lyrics: payload.lyrics,
        lyricsStatus: 'synced',
        audioReactiveMode: false,
        activeLyricIndex: -1
      });
    } else {
      // Fallback: No synced lyrics found
      set({
        lyrics: [],
        lyricsStatus: 'not_found',
        audioReactiveMode: true,
        activeLyricIndex: -1
      });
      get().addToast({
        title: 'Lyrics Unavailable',
        message: 'Lyrics unavailable for this track — Audio Reactive Constellation activated.',
        type: 'warning'
      });
    }
  },

  setLyricsStatus: (lyricsStatus) => set({ lyricsStatus }),
  setActiveLyricIndex: (activeLyricIndex) => set({ activeLyricIndex }),
  setAudioReactiveMode: (audioReactiveMode) => set({ audioReactiveMode }),

  resetTrack: () =>
    set({
      currentTrack: null,
      audioFeatures: null,
      lyrics: [],
      lyricsStatus: 'idle',
      isPlaying: false,
      currentTime: 0,
      activeLyricIndex: -1,
      audioReactiveMode: false
    })
}));

