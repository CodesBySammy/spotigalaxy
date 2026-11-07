/**
 * @file spotifyService.js
 * @description Communicates with Spotify Web API endpoints: current playback, audio features, and token refreshing.
 */

import axios from 'axios';
import { audioFeaturesCache } from '../utils/cache.js';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Global Spotify rate limit throttle timestamp
let rateLimitedUntil = 0;
let hasLogged403Notice = false;

function isRateLimited() {
  return Date.now() < rateLimitedUntil;
}

function handle429Error(error) {
  if (error.response?.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'], 10) || 5;
    rateLimitedUntil = Date.now() + retryAfter * 1000;
    console.warn(`[SpotifyService] 429 Rate limited by Spotify. Throttling requests for ${retryAfter}s.`);
  }
}

/**
 * Default fallback audio features when Spotify audio-features endpoint is restricted,
 * unavailable, or returns null (e.g. for local tracks or unsupported regions).
 */
const DEFAULT_AUDIO_FEATURES = {
  valence: 0.55,
  energy: 0.65,
  tempo: 120.0,
  danceability: 0.60,
  acousticness: 0.20,
  instrumentalness: 0.05,
  key: 0,
  mode: 1
};

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function getTokensFromCode(code, redirectUri, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(SPOTIFY_TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`
    }
  });

  return response.data;
}

/**
 * Refreshes an expired access token using the refresh token.
 */
export async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(SPOTIFY_TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`
    }
  });

  return response.data;
}

/**
 * Fetches the user's Spotify profile details.
 */
export async function getUserProfile(accessToken) {
  const response = await axios.get(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

/**
 * Fetches the user's currently playing track and its playback state.
 */
export async function getCurrentlyPlaying(accessToken) {
  if (isRateLimited()) {
    return null;
  }

  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 204
    });

    if (response.status === 204 || !response.data || !response.data.item) {
      return null; // No track is currently playing
    }

    const data = response.data;
    const item = data.item;

    return {
      isPlaying: Boolean(data.is_playing),
      progressMs: typeof data.progress_ms === 'number' ? data.progress_ms : 0,
      timestamp: data.timestamp || Date.now(),
      track: {
        id: item.id || 'spotify-playing-track',
        name: item.name || 'Unknown Track',
        artists: Array.isArray(item.artists) && item.artists.length > 0
          ? item.artists.map((a) => a.name).filter(Boolean)
          : ['Unknown Artist'],
        primaryArtist: item.artists && item.artists[0] && item.artists[0].name
          ? item.artists[0].name
          : 'Unknown Artist',
        album: item.album && item.album.name ? item.album.name : '',
        albumArt: item.album && Array.isArray(item.album.images) && item.album.images[0]
          ? item.album.images[0].url
          : '',
        durationMs: typeof item.duration_ms === 'number' && item.duration_ms > 0
          ? item.duration_ms
          : 180000,
        externalUrl: item.external_urls ? item.external_urls.spotify : null
      }
    };
  } catch (error) {
    handle429Error(error);
    throw error;
  }
}

const inFlightAudioFeatures = new Map();

/**
 * Fetches Spotify Audio Features (valence, energy, tempo, etc.) for a track ID.
 * Caches results to prevent hitting rate limits.
 */
export async function getAudioFeatures(trackId, accessToken) {
  if (!trackId) {
    return DEFAULT_AUDIO_FEATURES;
  }

  // Check in-memory cache first
  const cachedFeatures = audioFeaturesCache.get(trackId);
  if (cachedFeatures) {
    return cachedFeatures;
  }

  if (inFlightAudioFeatures.has(trackId)) {
    return inFlightAudioFeatures.get(trackId);
  }

  if (isRateLimited()) {
    return DEFAULT_AUDIO_FEATURES;
  }

  const promise = (async () => {
    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/audio-features/${trackId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.data) {
        const features = {
          valence: response.data.valence ?? DEFAULT_AUDIO_FEATURES.valence,
          energy: response.data.energy ?? DEFAULT_AUDIO_FEATURES.energy,
          tempo: Math.round(response.data.tempo ?? DEFAULT_AUDIO_FEATURES.tempo),
          danceability: response.data.danceability ?? DEFAULT_AUDIO_FEATURES.danceability,
          acousticness: response.data.acousticness ?? DEFAULT_AUDIO_FEATURES.acousticness,
          instrumentalness: response.data.instrumentalness ?? DEFAULT_AUDIO_FEATURES.instrumentalness,
          key: response.data.key ?? DEFAULT_AUDIO_FEATURES.key,
          mode: response.data.mode ?? DEFAULT_AUDIO_FEATURES.mode
        };

        // Store in cache
        audioFeaturesCache.set(trackId, features);
        return features;
      }
    } catch (error) {
      handle429Error(error);
      // Cache fallback features for this track so we don't repeatedly hammer Spotify or flood the terminal
      audioFeaturesCache.set(trackId, DEFAULT_AUDIO_FEATURES);
      
      if (error.response?.status === 403) {
        // Spotify restricted the audio-features endpoint for new developer apps in Nov 2024
        if (!hasLogged403Notice) {
          hasLogged403Notice = true;
          console.info('[Spotify API] Notice: Spotify restricted the /v1/audio-features endpoint (403 Forbidden). The visualizer is smoothly using the built-in harmonic vibe profile.');
        }
      } else {
        console.warn(`[SpotifyService] Audio features unavailable for ${trackId}: ${error.response?.status || error.message}. Using fallback vibe metrics.`);
      }
    } finally {
      inFlightAudioFeatures.delete(trackId);
    }

    return DEFAULT_AUDIO_FEATURES;
  })();

  inFlightAudioFeatures.set(trackId, promise);
  return promise;
}

