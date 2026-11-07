/**
 * @file App.tsx
 * @description Root application shell for Lyrical Constellation.
 */

import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useSpotifyPolling } from './hooks/useSpotifyPolling';
import { ConstellationCanvas } from './components/Visualizer/ConstellationCanvas';
import { VibeBorders } from './components/UI/VibeBorders';
import { TopNav } from './components/UI/TopNav';
import { PlayerHUD } from './components/UI/PlayerHUD';
import { LandingPage } from './components/UI/LandingPage';
import { IdleState } from './components/UI/IdleState';
import { ToastNotification } from './components/UI/ToastNotification';

export const App: React.FC = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const currentTrack = useStore((state) => state.currentTrack);
  const addToast = useStore((state) => state.addToast);
  const setAuth = useStore((state) => state.setAuth);

  // Activate Spotify polling engine
  useSpotifyPolling();

  // Handle URL auth query parameters (e.g. ?login=success or ?auth_error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    const loginSuccess = params.get('login');
    const ticket = params.get('ticket');

    const handleAuthResolution = async () => {
      if (ticket) {
        try {
          const claimRes = await fetch('/api/auth/claim-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket }),
            credentials: 'include'
          });

          if (claimRes.ok) {
            const statusRes = await fetch('/api/auth/status', { credentials: 'include' });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.isAuthenticated) {
                setAuth(true, statusData.user);
              }
            }
          }
        } catch (e) {
          console.warn('Session ticket claim failed:', e);
        }
      }

      if (loginSuccess === 'success') {
        addToast({
          title: 'Connected to Spotify',
          message: 'Successfully authenticated. Your constellation is ready.',
          type: 'success'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (authError) {
        addToast({
          title: 'Authentication Error',
          message: `Spotify sign-in failed: ${authError}`,
          type: 'error'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleAuthResolution();
  }, [addToast, setAuth]);

  const [zenMode, setZenMode] = React.useState(false);

  // Keyboard shortcuts: 'H' for Zen/Clean Wallpaper Mode, 'C' for Camera toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'h' || e.key === 'H') {
        setZenMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unauthenticated State: Show Landing Page
  if (!isAuthenticated) {
    return (
      <main className="relative w-full h-full min-h-screen overflow-hidden bg-[#020208]">
        <LandingPage />
        <ToastNotification />
      </main>
    );
  }

  // Authenticated State: Full 3D Visualizer Experience
  return (
    <main className="relative w-full h-full min-h-screen overflow-hidden bg-[#020208]">
      {/* 1. Fullscreen WebGL 3D Canvas */}
      <ConstellationCanvas />

      {/* 2. Ambient Vibe Border with Inset Shadow Aura */}
      {!zenMode && <VibeBorders />}

      {/* 3. Top Header HUD with telemetry and camera controls */}
      {!zenMode && <TopNav />}

      {/* 4. Idle State when no track is currently playing */}
      {!currentTrack && <IdleState />}

      {/* 5. Bottom Track Playback Bar and Active Lyric Spotlight */}
      {currentTrack && !zenMode && <PlayerHUD />}

      {/* Zen Mode hint button in bottom-right */}
      <button
        onClick={() => setZenMode((prev) => !prev)}
        title={zenMode ? 'Show HUD (Press H)' : 'Zen Wallpaper Mode (Press H)'}
        className="fixed bottom-4 right-4 z-40 px-2.5 py-1 rounded-lg glass-panel text-[10px] font-mono text-slate-400 hover:text-white transition-opacity border-white/5 opacity-40 hover:opacity-100"
      >
        {zenMode ? 'Exit Zen (H)' : 'Zen Mode (H)'}
      </button>

      {/* 6. Floating System Notifications */}
      <ToastNotification />
    </main>
  );
};

export default App;

