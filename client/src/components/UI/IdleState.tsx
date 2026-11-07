/**
 * @file IdleState.tsx
 * @description Relaxing cosmic idle screen when authenticated user is not playing any song on Spotify.
 */

import React from 'react';
import { Music2 } from 'lucide-react';

export const IdleState: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-6">
      <div className="glass-panel p-8 rounded-3xl border-white/10 max-w-md text-center shadow-2xl animate-float">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
          <Music2 className="w-8 h-8 text-sky-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">
          Awaiting Spotify Playback
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Play a track on Spotify to begin. Your celestial constellation will ignite automatically.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono text-emerald-400/90 uppercase tracking-widest">
            Listening for device stream
          </span>
        </div>
      </div>
    </div>
  );
};

export default IdleState;

