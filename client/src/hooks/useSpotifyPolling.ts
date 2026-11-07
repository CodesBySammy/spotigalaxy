/**
 * @file useSpotifyPolling.ts
 * @description Real-time Spotify playback synchronization hook.
 * Pings /api/now-playing on an interval, fetches time-synced lyrics on track changes,
 * and interpolates millisecond-accurate playback position with requestAnimationFrame.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { PlaybackResponse, LyricsPayload } from '../types';

export function useSpotifyPolling() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);
  const setAuth = useStore((state) => state.setAuth);
  const updatePlayback = useStore((state) => state.updatePlayback);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const setLyrics = useStore((state) => state.setLyrics);
  const setLyricsStatus = useStore((state) => state.setLyricsStatus);
  const resetTrack = useStore((state) => state.resetTrack);
  const addToast = useStore((state) => state.addToast);

  const currentTrackIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);

  // High-precision clock tracking refs
  const isPlayingRef = useRef<boolean>(false);
  const trackDurationSecRef = useRef<number>(0);
  const anchorTrackTimeSecRef = useRef<number>(0);
  const anchorPerfTimestampRef = useRef<number>(0);

  /**
   * Refreshes the Spotify access token via the backend.
   */
  const handleRefreshToken = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const res = await fetch('/refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Refresh failed');
      }

      console.log('[Polling] Token refreshed successfully.');
    } catch (err) {
      console.warn('[Polling] Session refresh failed, logging out:', err);
      setAuth(false, null);
      resetTrack();
      addToast({
        title: 'Session Expired',
        message: 'Your Spotify session has expired. Please log in again.',
        type: 'error'
      });
    } finally {
      isRefreshingRef.current = false;
    }
  };

  /**
   * Fetches lyrics for the given track from /api/lyrics.
   */
  const fetchLyrics = async (
    trackId: string,
    trackName: string,
    artistName: string,
    durationMs: number,
    albumName: string
  ) => {
    setLyricsStatus('loading');

    try {
      const durationSec = Math.round(durationMs / 1000);
      const query = new URLSearchParams({
        track_id: trackId,
        track_name: trackName,
        artist: artistName,
        duration: durationSec.toString(),
        album: albumName
      });

      const res = await fetch(`/api/lyrics?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Lyrics fetch failed with status ${res.status}`);
      }

      const data: LyricsPayload = await res.json();
      setLyrics(data);
    } catch (err) {
      console.warn('[Polling] Failed to fetch lyrics:', err);
      setLyrics({
        synced: false,
        instrumental: false,
        notFound: true,
        lyrics: []
      });
    }
  };

  /**
   * Core poll function to fetch /api/now-playing with network latency compensation
   * and Phase-Locked Loop (PLL) microsecond clock synchronization.
   */
  const pollNowPlaying = async () => {
    if (isFetchingRef.current || !isAuthenticated || user?.id === 'demo-traveler') return;
    isFetchingRef.current = true;
    const fetchStart = performance.now();

    try {
      const res = await fetch('/api/now-playing', {
        credentials: 'include'
      });

      if (res.status === 401) {
        // Access token expired, attempt silent token refresh
        await handleRefreshToken();
        return;
      }

      if (!res.ok) {
        return;
      }

      const fetchEnd = performance.now();
      // Round-trip network time and estimated one-way transit latency
      const roundTripSec = Math.max(0, (fetchEnd - fetchStart) / 1000);
      const oneWayTransitSec = roundTripSec * 0.5;

      const data: PlaybackResponse = await res.json();

      if (!data.track) {
        // Spotify is idle or user has not started playback
        isPlayingRef.current = false;
        currentTrackIdRef.current = null;
        updatePlayback(false, 0, Date.now(), null, null);
        return;
      }

      const track = data.track;
      const isPlaying = Boolean(data.isPlaying);
      const progressMs = data.progressMs || 0;
      
      // Compensate for transit time: Spotify was at progressMs when sending,
      // and music progressed forward during network transmission!
      const adjustedProgressSec = (progressMs / 1000) + (isPlaying ? oneWayTransitSec : 0);
      const durationSec = track.durationMs / 1000;

      isPlayingRef.current = isPlaying;
      trackDurationSecRef.current = durationSec;

      // Current estimated local time before this packet
      const currentEstimatedTime = anchorTrackTimeSecRef.current + 
        (isPlaying ? (fetchEnd - anchorPerfTimestampRef.current) / 1000 : 0);
      
      const drift = Math.abs(currentEstimatedTime - adjustedProgressSec);

      // Synchronization policy:
      // 1. If track changed, or paused -> playing, or user scrubbed/seeked (> 1.2s): Hard Snap
      if (currentTrackIdRef.current !== track.id || drift > 1.2 || anchorPerfTimestampRef.current === 0) {
        anchorTrackTimeSecRef.current = adjustedProgressSec;
        anchorPerfTimestampRef.current = fetchEnd;
      } else if (drift > 0.035) {
        // 2. Continuous Phase-Locked Loop (PLL) filter for subtle drift (35ms to 1.2s):
        // Nudge the clock smoothly towards reality by 50% each poll cycle,
        // eliminating any minor second lag completely without visual stutter!
        const clockError = adjustedProgressSec - currentEstimatedTime;
        anchorTrackTimeSecRef.current = currentEstimatedTime + clockError * 0.5;
        anchorPerfTimestampRef.current = fetchEnd;
      }

      // Check if track changed
      if (currentTrackIdRef.current !== track.id) {
        currentTrackIdRef.current = track.id;
        updatePlayback(isPlaying, progressMs, data.timestamp, track, data.audioFeatures);
        
        // Immediately trigger lyrics fetch
        fetchLyrics(
          track.id,
          track.name,
          track.primaryArtist,
          track.durationMs,
          track.album
        );
      } else {
        updatePlayback(isPlaying, progressMs, data.timestamp, track, data.audioFeatures);
        if (!isPlaying) {
          setCurrentTime(adjustedProgressSec);
        }
      }
    } catch (err) {
      console.error('[Polling] Error in pollNowPlaying:', err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Check auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch('/api/auth/status', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.isAuthenticated) {
          setAuth(true, data.user);
        } else if (data.canRefresh) {
          await handleRefreshToken();
        }
      } catch (e) {
        console.warn('[Polling] Check auth status failed:', e);
      }
    };

    checkAuthStatus();
  }, []);

  // Recurring polling loop with dynamic backoff
  useEffect(() => {
    if (!isAuthenticated) return;

    // Immediate initial poll
    pollNowPlaying();

    // Recurring polling loop with dynamic backoff and visibility throttling
    let timeoutId: number;

    const scheduleNextPoll = () => {
      // Background tab throttling: 30s when tab is hidden, 3s when playing, 6s when paused
      let nextDelay = isPlayingRef.current ? 3000 : 6000;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        nextDelay = 30000;
      }

      timeoutId = window.setTimeout(async () => {
        await pollNowPlaying();
        scheduleNextPoll();
      }, nextDelay);
    };

    scheduleNextPoll();

    // Tab visibility re-sync: if user returns from another tab, immediately cancel background backoff and poll
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timeoutId);
        pollNowPlaying();
        scheduleNextPoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Initialize demo traveler synthetic playback loop
  useEffect(() => {
    if (user?.id === 'demo-traveler') {
      isPlayingRef.current = true;
      trackDurationSecRef.current = 90;
      anchorTrackTimeSecRef.current = 0;
      anchorPerfTimestampRef.current = performance.now();
      currentTrackIdRef.current = 'celestial-demo-track';
    }
  }, [user?.id]);

  // High-precision requestAnimationFrame time advancement
  useEffect(() => {
    let animFrameId: number;

    const tick = () => {
      if (isPlayingRef.current && anchorPerfTimestampRef.current > 0) {
        const elapsedSinceAnchor = (performance.now() - anchorPerfTimestampRef.current) / 1000;
        let estimatedCurrent = anchorTrackTimeSecRef.current + elapsedSinceAnchor;

        // In demo mode, loop seamlessly around duration
        if (user?.id === 'demo-traveler' && trackDurationSecRef.current > 0) {
          if (estimatedCurrent >= trackDurationSecRef.current) {
            anchorTrackTimeSecRef.current = 0;
            anchorPerfTimestampRef.current = performance.now();
            estimatedCurrent = 0;
          }
        } else if (trackDurationSecRef.current > 0 && estimatedCurrent > trackDurationSecRef.current) {
          estimatedCurrent = trackDurationSecRef.current;
        }

        setCurrentTime(estimatedCurrent);
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [user?.id]);
}

