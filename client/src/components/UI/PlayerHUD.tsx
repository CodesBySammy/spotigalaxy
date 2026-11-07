/**
 * @file PlayerHUD.tsx
 * @description Sleek, minimalist glassmorphic playback dock.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Music, Radio, Disc3, Mic2, X } from 'lucide-react';
import { getDynamicSongTheme } from '../../utils/colorUtils';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Subcomponent for the high-frequency time bar (60fps updates isolated here)
 */
const TimelineProgress: React.FC<{ durationSec: number; valenceColor: string }> = ({
  durationSec,
  valenceColor
}) => {
  const currentTime = useStore((state) => state.currentTime);
  const progressRatio = durationSec > 0 ? Math.min(1, Math.max(0, currentTime / durationSec)) : 0;

  return (
    <div className="flex-1 max-w-xs hidden sm:flex flex-col gap-1">
      <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-150 ease-linear"
          style={{
            width: `${progressRatio * 100}%`,
            backgroundColor: valenceColor,
            boxShadow: `0 0 8px ${valenceColor}`
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(durationSec)}</span>
      </div>
    </div>
  );
};

/**
 * Fullscreen Interactive Lyrics Drawer Modal
 */
const FullLyricsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const lyrics = useStore((state) => state.lyrics);
  const activeLyricIndex = useStore((state) => state.activeLyricIndex);
  const currentTrack = useStore((state) => state.currentTrack);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active lyric smoothly
  useEffect(() => {
    if (!isOpen || activeLyricIndex < 0) return;
    const activeEl = scrollRef.current?.querySelector(`[data-lyric-index="${activeLyricIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen, activeLyricIndex]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[75vh] flex flex-col rounded-3xl glass-panel border border-white/10 shadow-2xl overflow-hidden bg-slate-950/90"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-bold text-white truncate">{currentTrack?.name}</h3>
            <p className="text-xs text-slate-400 truncate">{currentTrack?.artists?.join(', ')}</p>
          </div>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrolling Lyrics List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {lyrics.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-10">No synchronized lyrics available.</p>
          ) : (
            lyrics.map((line, idx) => {
              const isActive = idx === activeLyricIndex;
              return (
                <div
                  key={idx}
                  data-lyric-index={idx}
                  className={`transition-all duration-300 py-1 text-center select-none ${
                    isActive
                      ? 'text-base font-bold text-white scale-105 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : 'text-sm font-medium text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {line.text}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Subcomponent for active lyric line banner
 */
const ActiveLyricBanner: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  const lyrics = useStore((state) => state.lyrics);
  const activeLyricIndex = useStore((state) => state.activeLyricIndex);
  const activeLyric = activeLyricIndex >= 0 && lyrics[activeLyricIndex] ? lyrics[activeLyricIndex].text : '';

  if (!activeLyric) return null;

  return (
    <div
      onClick={onOpenModal}
      title="Click to view full song lyrics"
      className="px-6 py-2.5 rounded-2xl bg-slate-950/75 backdrop-blur-xl text-center max-w-[92vw] sm:max-w-xl pointer-events-auto border border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.6)] animate-fade-in cursor-pointer hover:border-white/30 transition-all hover:scale-[1.01]"
    >
      <p className="text-xs sm:text-sm font-semibold text-white tracking-wide break-words line-clamp-3 leading-relaxed drop-shadow">
        {activeLyric}
      </p>
    </div>
  );
};

export const PlayerHUD: React.FC = () => {
  const currentTrack = useStore((state) => state.currentTrack);
  const audioFeatures = useStore((state) => state.audioFeatures);
  const lyricsLength = useStore((state) => state.lyrics.length);
  const activeLyricIndex = useStore((state) => state.activeLyricIndex);
  const lyricsStatus = useStore((state) => state.lyricsStatus);
  const audioReactiveMode = useStore((state) => state.audioReactiveMode);
  const lyricOffsetMs = useStore((state) => state.lyricOffsetMs);
  const setLyricOffsetMs = useStore((state) => state.setLyricOffsetMs);

  const [showLyricsModal, setShowLyricsModal] = useState(false);

  if (!currentTrack) return null;

  const durationSec = currentTrack.durationMs / 1000;

  // Compute theme from lyric progress without 60fps re-render overhead
  const theme = useMemo(() => {
    const progress = activeLyricIndex >= 0 && lyricsLength > 0 ? activeLyricIndex / lyricsLength : 0;
    const curTime = useStore.getState().currentTime;
    return getDynamicSongTheme(
      currentTrack,
      progress,
      curTime,
      audioFeatures?.tempo ?? 120,
      audioFeatures?.energy ?? 0.5
    );
  }, [currentTrack, activeLyricIndex, lyricsLength, audioFeatures]);

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-30 px-6 py-4 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2.5">
          {/* Subtle, Minimalist Active Lyric Banner */}
          <ActiveLyricBanner onOpenModal={() => setShowLyricsModal(true)} />

          {/* Minimalist Dock */}
          <div className="w-full glass-panel px-4 py-2.5 rounded-2xl flex items-center justify-between gap-4 pointer-events-auto border-white/5 shadow-2xl">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 min-w-0">
            {currentTrack.albumArt ? (
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.album}
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 flex-shrink-0">
                <Disc3 className="w-5 h-5 animate-spin-slow" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs md:text-sm font-semibold text-slate-100 truncate">
                  {currentTrack.name}
                </h2>
                {/* 4-bar dynamic audio equalizer */}
                <div className="flex items-end gap-0.5 h-3 px-1 flex-shrink-0" title="Audio Reactive Stream">
                  <span
                    className="w-0.5 rounded-full animate-pulse"
                    style={{ height: '55%', backgroundColor: theme.primaryColor }}
                  />
                  <span
                    className="w-0.5 rounded-full animate-pulse"
                    style={{ height: '95%', animationDelay: '-0.2s', backgroundColor: theme.secondaryColor }}
                  />
                  <span
                    className="w-0.5 rounded-full animate-pulse"
                    style={{ height: '40%', animationDelay: '-0.4s', backgroundColor: theme.primaryColor }}
                  />
                  <span
                    className="w-0.5 rounded-full animate-pulse"
                    style={{ height: '80%', animationDelay: '-0.1s', backgroundColor: theme.secondaryColor }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {currentTrack.artists.join(', ')}
              </p>
            </div>
          </div>

          {/* Center: Sleek Minimal Timeline Progress */}
          <TimelineProgress durationSec={durationSec} valenceColor={theme.primaryColor} />

          {/* Right: Lyrics Status Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lyricsStatus === 'loading' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] font-mono text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>Locating...</span>
              </div>
            )}

            {lyricsStatus === 'synced' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowLyricsModal(true)}
                  title="Click to view full lyrics drawer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/35 text-[11px] font-mono text-indigo-300 transition-all cursor-pointer"
                >
                  <Mic2 className="w-3 h-3 text-indigo-400" />
                  <span>Synced ({lyricsLength})</span>
                </button>
                
                {/* Audio Latency Calibration Controller */}
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400">
                  <button
                    onClick={() => setLyricOffsetMs((prev) => prev - 50)}
                    title="Nudge lyrics earlier (-50ms)"
                    className="hover:text-white transition-colors px-1"
                  >
                    -
                  </button>
                  <span title="Lyric lead calibration" className="text-slate-300 select-none">
                    {lyricOffsetMs >= 0 ? `+${lyricOffsetMs}ms` : `${lyricOffsetMs}ms`}
                  </span>
                  <button
                    onClick={() => setLyricOffsetMs((prev) => prev + 50)}
                    title="Nudge lyrics later (+50ms)"
                    className="hover:text-white transition-colors px-1"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {lyricsStatus === 'instrumental' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono text-purple-300">
                <Music className="w-3 h-3" />
                <span>Instrumental</span>
              </div>
            )}

            {(lyricsStatus === 'not_found' || (audioReactiveMode && lyricsStatus !== 'instrumental')) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Audio Reactive</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>

    {/* Interactive Fullscreen Lyrics Drawer */}
    <FullLyricsModal isOpen={showLyricsModal} onClose={() => setShowLyricsModal(false)} />
  </>
  );
};

export default PlayerHUD;
