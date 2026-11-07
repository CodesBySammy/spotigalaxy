/**
 * @file lyricsService.js
 * @description Integrates with the free, open-source LRCLIB API (https://lrclib.net).
 * Fetches time-synced lyrics (.lrc), parses them with sub-second precision,
 * handles instrumental / un-synced tracks, and caches responses.
 */

import axios from 'axios';
import { parseLrc } from '../utils/lrcParser.js';
import { lyricsCache } from '../utils/cache.js';

const LRCLIB_BASE_URL = 'https://lrclib.net/api';

/**
 * Cleans track name to improve LRCLIB match probability.
 * Removes parenthetical suffixes like "(Remastered 2021)", "- Live at ...", "(feat. Artist)", etc.
 */
function sanitizeTrackName(name) {
  if (!name) return '';
  return name
    .replace(/\s*-\s*(Remastered|Live|Radio Edit|Acoustic|Single Version|Mono|Stereo).*/i, '')
    .replace(/\s*\((feat\.|with|remastered|live|acoustic|deluxe).*\)/i, '')
    .trim();
}

// Single-flight deduplication map for concurrent in-flight requests
const inFlightLyricsRequests = new Map();

/**
 * Fetches lyrics from LRCLIB using exact match (/get) or fallback search (/search).
 * 
 * @param {string} trackId - Spotify Track ID for caching key.
 * @param {string} trackName - Name of the song.
 * @param {string} artistName - Name of the artist.
 * @param {number} durationSeconds - Duration in seconds (e.g. 215).
 * @param {string} albumName - Optional album name.
 */
export async function getTrackLyrics(trackId, trackName, artistName, durationSeconds, albumName = '') {
  const cacheKey = trackId || `${trackName}:::${artistName}`;

  // 1. Check in-memory cache
  const cached = lyricsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Deduplicate concurrent in-flight requests for the exact same track
  if (inFlightLyricsRequests.has(cacheKey)) {
    return inFlightLyricsRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const cleanTitle = sanitizeTrackName(trackName);
      const roundedDuration = Math.round(durationSeconds || 0);

      let lrcData = null;

      // 2. Try exact match endpoint: /api/get
      try {
        const params = {
          track_name: cleanTitle,
          artist_name: artistName
        };
        if (roundedDuration > 0) {
          params.duration = roundedDuration;
        }
        if (albumName) {
          params.album_name = albumName;
        }

        const response = await axios.get(`${LRCLIB_BASE_URL}/get`, {
          params,
          headers: { 'User-Agent': 'LyricalConstellation/1.0 (https://github.com/lyrical-constellation)' },
          timeout: 5000,
          validateStatus: (status) => status === 200 || status === 404
        });

        if (response.status === 200 && response.data) {
          lrcData = response.data;
        }
      } catch (err) {
        console.warn(`[LyricsService] /api/get failed for "${cleanTitle}":`, err.message);
      }

      // 3. Fallback search endpoint if exact match wasn't found or returned 404
      if (!lrcData) {
        try {
          const searchQuery = `${cleanTitle} ${artistName}`;
          const searchRes = await axios.get(`${LRCLIB_BASE_URL}/search`, {
            params: { q: searchQuery },
            headers: { 'User-Agent': 'LyricalConstellation/1.0 (https://github.com/lyrical-constellation)' },
            timeout: 5000
          });

          if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
            const withSynced = searchRes.data.find(
              (item) => item.syncedLyrics && item.syncedLyrics.length > 0
            );
            lrcData = withSynced || searchRes.data[0];
          }
        } catch (searchErr) {
          console.warn(`[LyricsService] /api/search failed for query "${cleanTitle}":`, searchErr.message);
        }
      }

      // 4. Format and process the lyrics payload
      let result = {
        synced: false,
        instrumental: false,
        notFound: true,
        lyrics: [],
        plainLyrics: ''
      };

      if (lrcData) {
        if (lrcData.instrumental) {
          result = {
            synced: false,
            instrumental: true,
            notFound: false,
            lyrics: [],
            plainLyrics: ''
          };
        } else if (lrcData.syncedLyrics) {
          const parsed = parseLrc(lrcData.syncedLyrics);
          result = {
            synced: true,
            instrumental: false,
            notFound: false,
            lyrics: parsed,
            plainLyrics: lrcData.plainLyrics || ''
          };
        } else if (lrcData.plainLyrics) {
          result = {
            synced: false,
            instrumental: false,
            notFound: false,
            lyrics: [],
            plainLyrics: lrcData.plainLyrics
          };
        }
      }

      // 5. Cache result: 24 hours for found lyrics/instrumental, 3 minutes for not-found (resilient against transient network drops)
      const ttlMs = result.notFound ? 3 * 60 * 1000 : 24 * 60 * 60 * 1000;
      lyricsCache.set(cacheKey, result, ttlMs);
      return result;
    } finally {
      inFlightLyricsRequests.delete(cacheKey);
    }
  })();

  inFlightLyricsRequests.set(cacheKey, promise);
  return promise;
}

