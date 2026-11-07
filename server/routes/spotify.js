/**
 * @file spotify.js
 * @description Spotify player and audio features data endpoints.
 */

import express from 'express';
import { getCurrentlyPlaying, getAudioFeatures } from '../services/spotifyService.js';

const router = express.Router();
const ACCESS_COOKIE_NAME = 'spotify_access_token';

/**
 * Middleware to extract access token from cookies or Authorization header.
 */
function getAccessToken(req) {
  if (req.cookies && req.cookies[ACCESS_COOKIE_NAME]) {
    return req.cookies[ACCESS_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * GET /api/now-playing
 * Fetches the currently playing track along with Spotify audio features
 * (valence, energy, tempo, danceability, acousticness).
 */
router.get('/now-playing', async (req, res) => {
  const accessToken = getAccessToken(req);

  if (!accessToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No Spotify access token provided. Please log in.'
    });
  }

  try {
    const playback = await getCurrentlyPlaying(accessToken);

    if (!playback) {
      // User is logged in, but not currently playing anything on Spotify
      return res.json({
        isPlaying: false,
        track: null,
        audioFeatures: null,
        message: 'No track is currently playing on Spotify'
      });
    }

    // Retrieve audio features for the playing track (uses cache internally)
    const audioFeatures = await getAudioFeatures(playback.track.id, accessToken);

    return res.json({
      isPlaying: playback.isPlaying,
      progressMs: playback.progressMs,
      timestamp: playback.timestamp || Date.now(),
      track: playback.track,
      audioFeatures: audioFeatures
    });
  } catch (error) {
    const rawStatus = error.response?.status;
    const status = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;

    if (status === 401) {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Spotify access token expired. Refresh required.'
      });
    }

    console.error('[Now Playing Route Error]:', error.response?.data || error.message);
    return res.status(status).json({
      error: 'SpotifyFetchError',
      message: 'Failed to retrieve currently playing track from Spotify.'
    });
  }
});

export default router;

