/**
 * @file VibeBorders.tsx
 * @description Dynamic Living Celestial Perimeter.
 * Features vibrant colors that actively shift across the song,
 * rendered with hardware-accelerated SVG border beams and smooth atmospheric auroras.
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { getDynamicSongTheme } from '../../utils/colorUtils';

export const VibeBorders: React.FC = () => {
  const currentTrack = useStore((state) => state.currentTrack);
  const audioFeatures = useStore((state) => state.audioFeatures);
  const isPlaying = useStore((state) => state.isPlaying);

  // Throttled smooth color state: updates once per second (not 60fps)
  // CSS handles the fluid 1000ms transition for zero lag!
  const [theme, setTheme] = useState(() =>
    getDynamicSongTheme(currentTrack, 0, 0, audioFeatures?.tempo ?? 120, audioFeatures?.energy ?? 0.5)
  );

  useEffect(() => {
    // Immediate update on track change
    const curTime = useStore.getState().currentTime;
    const durSec = (currentTrack?.durationMs ?? 180000) / 1000;
    const p = durSec > 0 ? Math.min(1, Math.max(0, curTime / durSec)) : 0;
    setTheme(getDynamicSongTheme(currentTrack, p, curTime, audioFeatures?.tempo ?? 120, audioFeatures?.energy ?? 0.5));

    if (!isPlaying) return;

    // Smooth 1.2s tick: updates color phase smoothly without CPU thrashing
    const interval = setInterval(() => {
      const liveTime = useStore.getState().currentTime;
      const liveDur = (useStore.getState().currentTrack?.durationMs ?? 180000) / 1000;
      const liveP = liveDur > 0 ? Math.min(1, Math.max(0, liveTime / liveDur)) : 0;
      const liveFeatures = useStore.getState().audioFeatures;

      setTheme(
        getDynamicSongTheme(
          useStore.getState().currentTrack,
          liveP,
          liveTime,
          liveFeatures?.tempo ?? 120,
          liveFeatures?.energy ?? 0.5
        )
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [currentTrack?.id, isPlaying, audioFeatures]);

  const { primaryColor, secondaryColor, vibeGlow, pulseDuration } = theme;

  const dynamicStyles = {
    '--vibe-primary': primaryColor,
    '--vibe-secondary': secondaryColor,
    '--vibe-glow': vibeGlow,
    '--pulse-duration': isPlaying ? pulseDuration : '6s'
  } as React.CSSProperties;

  return (
    <div
      style={dynamicStyles}
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden transition-colors duration-1000 ease-out"
      aria-hidden="true"
    >
      {/* 1. Deep Space Vignette with Inset Glow */}
      <div className="absolute inset-0 vibe-border-overlay pointer-events-none" />

      {/* 2. Hardware-Accelerated Traveling SVG Border Beam (0% CPU, 100% GPU) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          fill="none"
          stroke="url(#beam-gradient)"
          strokeWidth="1.5"
          className="animate-border-beam"
        />
      </svg>

      {/* 3. Top Atmospheric Auroral Atmosphere Ribbon */}
      <div
        className="absolute top-0 left-0 right-0 h-40 blur-3xl opacity-40 animate-aurora-glow pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% -10%, ${primaryColor} 0%, transparent 80%)`
        }}
      />

      {/* 4. Bottom Atmospheric Auroral Atmosphere Ribbon */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 blur-3xl opacity-35 animate-aurora-glow pointer-events-none transition-all duration-1000"
        style={{
          animationDelay: '-3.5s',
          background: `radial-gradient(ellipse 80% 70% at 50% 115%, ${secondaryColor} 0%, transparent 80%)`
        }}
      />

      {/* 5. Minimalist Sci-Fi Constellation Corner Brackets */}
      {/* Top Left */}
      <div className="absolute top-4 left-4 flex items-start gap-1">
        <div
          className="w-5 h-5 border-t-[1.5px] border-l-[1.5px] rounded-tl-sm transition-colors duration-700"
          style={{ borderColor: primaryColor }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full mt-[-2px] ml-[-2px] transition-colors duration-700 animate-pulse"
          style={{ backgroundColor: secondaryColor, boxShadow: `0 0 6px ${secondaryColor}` }}
        />
      </div>

      {/* Top Right */}
      <div className="absolute top-4 right-4 flex items-start justify-end gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full mt-[-2px] mr-[-2px] transition-colors duration-700 animate-pulse"
          style={{ backgroundColor: primaryColor, boxShadow: `0 0 6px ${primaryColor}` }}
        />
        <div
          className="w-5 h-5 border-t-[1.5px] border-r-[1.5px] rounded-tr-sm transition-colors duration-700"
          style={{ borderColor: secondaryColor }}
        />
      </div>

      {/* Bottom Left */}
      <div className="absolute bottom-4 left-4 flex items-end gap-1">
        <div
          className="w-5 h-5 border-b-[1.5px] border-l-[1.5px] rounded-bl-sm transition-colors duration-700"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full mb-[-2px] ml-[-2px] transition-colors duration-700 animate-pulse"
          style={{ backgroundColor: primaryColor, boxShadow: `0 0 6px ${primaryColor}` }}
        />
      </div>

      {/* Bottom Right */}
      <div className="absolute bottom-4 right-4 flex items-end justify-end gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full mb-[-2px] mr-[-2px] transition-colors duration-700 animate-pulse"
          style={{ backgroundColor: secondaryColor, boxShadow: `0 0 6px ${secondaryColor}` }}
        />
        <div
          className="w-5 h-5 border-b-[1.5px] border-r-[1.5px] rounded-br-sm transition-colors duration-700"
          style={{ borderColor: primaryColor }}
        />
      </div>
    </div>
  );
};

export default VibeBorders;
