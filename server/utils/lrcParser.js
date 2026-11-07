/**
 * @file lrcParser.js
 * @description Robust, production-grade parser for raw LRC (LyRiCs) string formats.
 * Handles single/multiple timestamp tags, sub-second precision (2 or 3 decimals),
 * metadata tag filtering ([ar:...], [ti:...]), and chronologically sorts output lines.
 */

/**
 * Regex matching LRC timestamp formats: [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
 * e.g., [01:23.45], [00:04.120], [2:05]
 */
const TIME_TAG_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

/**
 * Regex matching metadata headers like [ar:Artist], [ti:Title], [length:03:20]
 */
const METADATA_TAG_REGEX = /^\[[a-zA-Z]+:[^\]]*\]$/;

/**
 * Parses raw LRC string content into a sorted array of timed lyric objects.
 * 
 * @param {string} rawLrc - The raw .lrc format string from LRCLIB or other sources.
 * @returns {Array<{ time: number, text: string }>} Chronologically sorted array of lyric objects.
 */
export function parseLrc(rawLrc) {
  if (!rawLrc || typeof rawLrc !== 'string') {
    return [];
  }

  const lines = rawLrc.split(/\r?\n/);
  const parsedLyrics = [];

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();

    // Skip blank lines
    if (!trimmedLine) continue;

    // Skip metadata tags such as [ti:Song Title], [ar:Artist Name], [al:Album Name]
    if (METADATA_TAG_REGEX.test(trimmedLine)) {
      continue;
    }

    // Find all timestamp tags in this line
    const matches = [...trimmedLine.matchAll(TIME_TAG_REGEX)];

    if (matches.length === 0) {
      // Un-synced line or plain text inside LRC
      continue;
    }

    // Extract lyric text by stripping all timestamp markers
    const text = trimmedLine.replace(TIME_TAG_REGEX, '').trim();

    // In LRC format, multiple timestamps can precede the same text: e.g., [00:12.00][00:24.00]Repeat chorus
    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let milliseconds = 0;

      if (match[3]) {
        // If 2 digits: centiseconds (1/100s) -> multiply by 10 to get ms
        // If 3 digits: milliseconds (1/1000s)
        if (match[3].length === 2) {
          milliseconds = parseInt(match[3], 10) * 10;
        } else {
          milliseconds = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
        }
      }

      const totalSeconds = Number((minutes * 60 + seconds + milliseconds / 1000).toFixed(3));

      // Discard empty instrumental markers unless there is actual text or musical cue
      if (text.length > 0) {
        parsedLyrics.push({
          time: totalSeconds,
          text: text
        });
      }
    }
  }

  // Sort chronologically ascending
  parsedLyrics.sort((a, b) => a.time - b.time);

  // Deduplicate entries that have exact same timestamp and text
  const deduplicated = [];
  for (let i = 0; i < parsedLyrics.length; i++) {
    const current = parsedLyrics[i];
    const prev = deduplicated[deduplicated.length - 1];

    if (!prev || prev.time !== current.time || prev.text !== current.text) {
      deduplicated.push(current);
    }
  }

  return deduplicated;
}

export default parseLrc;

