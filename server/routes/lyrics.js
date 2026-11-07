/**
 * @file lyrics.js
 * @description Lyrics retrieval route interfacing with LRCLIB.
 */

import express from 'express';
import { getTrackLyrics } from '../services/lyricsService.js';

const router = express.Router();

/**
 * GET /api/lyrics
 * Queries LRCLIB for synced lyrics using track name, artist, and duration.
 * Returns parsed JSON array: [{ time: 12.34, text: "..." }, ...]
 */
router.get('/', async (req, res) => {
  const { track_name, artist, duration, track_id, album } = req.query;

  if (!track_name || !artist) {
    return res.status(400).json({
      error: 'MissingParameters',
      message: 'Both "track_name" and "artist" query parameters are required.'
    });
  }

  const durationSec = duration ? parseFloat(duration) : 0;

  try {
    const lyricsData = await getTrackLyrics(
      track_id,
      track_name,
      artist,
      durationSec,
      album || ''
    );

    return res.json(lyricsData);
  } catch (error) {
    console.error('[Lyrics Route Error]:', error.message);
    return res.status(500).json({
      error: 'LyricsFetchError',
      message: 'Failed to retrieve or parse lyrics.',
      lyrics: [],
      synced: false,
      instrumental: false,
      notFound: true
    });
  }
});

export default router;

