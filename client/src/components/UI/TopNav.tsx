/**
 * @file TopNav.tsx
 * @description Sleek top navigation HUD with real-time constellation shape switcher
 * and audio-reactive equalizer telemetry.
 */

import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Sparkles, Video, Orbit, LogOut, Disc, CircleDot, Globe2 } from 'lucide-react';
import { getDynamicSongTheme } from '../../utils/colorUtils';

const PITCH_CLASSES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export const TopNav: React.FC = () => {
  const currentTrack = useStore((state) => state.currentTrack);
  const user = useStore((state) => state.user);
  const audioFeatures = useStore((state) => state.audioFeatures);
  const cinematicCamera = useStore((state) => state.cinematicCamera);
  const setCinematicCamera = useStore((state) => state.setCinematicCamera);
  const constellationShape = useStore((state) => state.constellationShape);
  const setConstellationShape = useStore((state) => state.setConstellationShape);
  const isPlaying = useStore((state) => state.isPlaying);
  const setAuth = useStore((state) => state.setAuth);
  const resetTrack = useStore((state) => state.resetTrack);

  const energy = audioFeatures?.energy ?? 0.5;
  const tempo = audioFeatures?.tempo ?? 120;
  const key = audioFeatures?.key ?? 0;
  const mode = audioFeatures?.mode ?? 1;

  const keyDisplay = key >= 0 && key < 12 
    ? `${PITCH_CLASSES[key]} ${mode === 1 ? 'Maj' : 'Min'}` 
    : '—';

  const theme = useMemo(() => {
    return getDynamicSongTheme(currentTrack, 0.5, 0, tempo, energy);
  }, [currentTrack, tempo, energy]);

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout request failed:', e);
    }
    setAuth(false, null);
    resetTrack();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between pointer-events-none">
      {/* Brand Identity - Minimalist Sleek Logo with Audio Wave */}
      <div className="flex items-center space-x-3 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-100 flex items-center gap-2">
            SpotiGalaxy
            {isPlaying && (
              <span className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-3 bg-emerald-400 animate-ping" />
                <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse" />
              </span>
            )}
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">3D Audio Space</p>
        </div>
      </div>

      {/* Central Minimalist Telemetry & Shape Switcher */}
      <div className="hidden md:flex items-center gap-3 pointer-events-auto">
        {/* Geometric Constellation Mode Selector */}
        <div className="glass-panel p-1 rounded-xl flex items-center gap-1 border-white/5">
          <button
            onClick={() => setConstellationShape('spiral')}
            title="Archimedean Cosmic Spiral"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              constellationShape === 'spiral'
                ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3 h-3 text-indigo-400" />
            <span>Spiral</span>
          </button>

          <button
            onClick={() => setConstellationShape('ring')}
            title="Celestial Orbital Ring"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              constellationShape === 'ring'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CircleDot className="w-3 h-3 text-sky-400" />
            <span>Ring</span>
          </button>

          <button
            onClick={() => setConstellationShape('sphere')}
            title="Supernova Planetary Sphere"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              constellationShape === 'sphere'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe2 className="w-3 h-3 text-purple-400" />
            <span>Sphere</span>
          </button>
        </div>

        {/* Audio Telemetry Pill */}
        {audioFeatures && (
          <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] font-mono text-slate-400 border-white/5">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block transition-colors duration-500"
              style={{ backgroundColor: theme.primaryColor, boxShadow: `0 0 6px ${theme.primaryColor}` }}
            />
            <span>{Math.round(energy * 100)}% Energy</span>
            <span className="text-slate-600">|</span>
            <span>{tempo} BPM</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-medium">{keyDisplay}</span>
          </div>
        )}
      </div>

      {/* Right Controls: Minimalist Camera & User info */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={() => setCinematicCamera((prev) => !prev)}
          title={cinematicCamera ? 'Switch to Manual Orbit' : 'Switch to Cinematic Follow'}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all border ${
            cinematicCamera
              ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20'
              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {cinematicCamera ? (
            <span className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cinematic</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Orbit className="w-3.5 h-3.5 text-slate-400" />
              <span>Orbit</span>
            </span>
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2 glass-panel pl-1.5 pr-2.5 py-1 rounded-xl border-white/5">
            {user.images && user.images[0] ? (
              <img
                src={user.images[0].url}
                alt={user.displayName}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-600/40 flex items-center justify-center text-[10px] text-white">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
