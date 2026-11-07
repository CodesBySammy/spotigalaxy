/**
 * @file auth.js
 * @description Spotify OAuth 2.0 Authorization Code Flow endpoints.
 * Secures tokens in HTTP-only, SameSite cookies ensuring the client secret is never exposed.
 */

import express from 'express';
import crypto from 'crypto';
import { getTokensFromCode, refreshAccessToken, getUserProfile } from '../services/spotifyService.js';

const router = express.Router();

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-email',
  'user-read-private'
].join(' ');

const STATE_COOKIE_NAME = 'spotify_auth_state';
const ACCESS_COOKIE_NAME = 'spotify_access_token';
const REFRESH_COOKIE_NAME = 'spotify_refresh_token';

const isProduction = process.env.NODE_ENV === 'production';

// Stateless cryptographic helpers for cluster and multi-instance scalability
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.COOKIE_SECRET || process.env.SPOTIFY_CLIENT_SECRET || 'lyrical-constellation-secure-secret-token')
  .digest();

function createSignedState() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const data = `${nonce}.${timestamp}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  return `${data}.${hmac}`;
}

function verifySignedState(state) {
  if (!state || typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, timestampStr, hmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > 10 * 60 * 1000) {
    return false; // Expired state (> 10 minutes)
  }
  const data = `${nonce}.${timestampStr}`;
  const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');

  const hmacBuf = Buffer.from(hmac, 'utf8');
  const expectedBuf = Buffer.from(expectedHmac, 'utf8');

  // Guard against RangeError if buffer lengths differ
  if (hmacBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(hmacBuf, expectedBuf);
}

function createSessionTicket(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  const json = JSON.stringify({ ...payload, ts: Date.now() });
  let enc = cipher.update(json, 'utf8', 'base64');
  enc += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc}`;
}

function verifySessionTicket(ticket) {
  if (!ticket || typeof ticket !== 'string') return null;
  try {
    const parts = ticket.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, enc] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    if (iv.length !== 12 || tag.length !== 16) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
    decipher.setAuthTag(tag);
    let dec = decipher.update(enc, 'base64', 'utf8');
    dec += decipher.final('utf8');
    const payload = JSON.parse(dec);
    if (Date.now() - payload.ts > 60 * 1000) {
      return null; // Expired ticket (> 60s)
    }
    return payload;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/'
};

/**
 * GET /login
 * Initiates Spotify OAuth flow by redirecting to Spotify Accounts Service.
 */
router.get('/login', (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Spotify client credentials or redirect URI missing in server configuration.' });
  }

  // Generate stateless HMAC-signed cryptographic state to protect against CSRF attacks
  const state = createSignedState();

  res.cookie(STATE_COOKIE_NAME, state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });

  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state: state,
    show_dialog: 'true'
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
});

/**
 * GET /callback
 * Handles the redirect from Spotify after user consents.
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const storedState = req.cookies ? req.cookies[STATE_COOKIE_NAME] : null;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // Clear state cookie
  res.clearCookie(STATE_COOKIE_NAME, cookieOptions);

  if (error) {
    return res.redirect(`${clientUrl}?auth_error=${encodeURIComponent(error)}`);
  }

  // Valid if either HMAC signature matches OR cookie matches (100% stateless verification)
  const isStateValid = Boolean(state && (verifySignedState(state) || (storedState && state === storedState)));

  if (!state || !isStateValid) {
    return res.redirect(`${clientUrl}?auth_error=state_mismatch`);
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    const tokenData = await getTokensFromCode(code, redirectUri, clientId, clientSecret);
    const { access_token, refresh_token, expires_in } = tokenData;

    // Create a 60-second stateless AES-256-GCM encrypted claim ticket
    const ticket = createSessionTicket({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in
    });

    // Set secure HTTP-only cookies on this origin as well
    res.cookie(ACCESS_COOKIE_NAME, access_token, {
      ...cookieOptions,
      maxAge: (expires_in || 3600) * 1000
    });

    if (refresh_token) {
      res.cookie(REFRESH_COOKIE_NAME, refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    // Redirect to the frontend client with claim ticket
    res.redirect(`${clientUrl}?ticket=${encodeURIComponent(ticket)}&login=success`);
  } catch (err) {
    console.error('[Auth Callback Error]:', err.response?.data || err.message);
    res.redirect(`${clientUrl}?auth_error=token_exchange_failed`);
  }
});

/**
 * POST /api/auth/claim-session
 * Exchanges a stateless encrypted ticket for local session cookies.
 * Works seamlessly across multi-instance clusters and localhost/127.0.0.1 boundaries.
 */
router.post('/api/auth/claim-session', (req, res) => {
  const { ticket } = req.body || {};
  const session = verifySessionTicket(ticket);

  if (!session) {
    return res.status(400).json({ error: 'Invalid or expired session ticket' });
  }

  res.cookie(ACCESS_COOKIE_NAME, session.accessToken, {
    ...cookieOptions,
    maxAge: (session.expiresIn || 3600) * 1000
  });

  if (session.refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
  }

  return res.json({ success: true });
});

/**
 * POST /refresh_token
 * Silently refreshes the access token using the stored HTTP-only refresh token cookie.
 */
router.post('/refresh_token', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available. Please log in again.' });
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const tokenData = await refreshAccessToken(refreshToken, clientId, clientSecret);
    const { access_token, expires_in, refresh_token: newRefreshToken } = tokenData;

    res.cookie(ACCESS_COOKIE_NAME, access_token, {
      ...cookieOptions,
      maxAge: (expires_in || 3600) * 1000
    });

    if (newRefreshToken) {
      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    return res.json({
      success: true,
      expiresIn: expires_in
    });
  } catch (err) {
    console.error('[Auth Refresh Error]:', err.response?.data || err.message);
    res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
    return res.status(401).json({ error: 'Failed to refresh token. Session expired.' });
  }
});

/**
 * GET /api/auth/status
 * Checks if the current session has valid credentials and returns basic user profile.
 */
router.get('/api/auth/status', async (req, res) => {
  const accessToken = req.cookies[ACCESS_COOKIE_NAME];
  const hasRefreshToken = Boolean(req.cookies[REFRESH_COOKIE_NAME]);

  if (!accessToken) {
    return res.json({
      isAuthenticated: false,
      canRefresh: hasRefreshToken,
      user: null
    });
  }

  try {
    const profile = await getUserProfile(accessToken);
    return res.json({
      isAuthenticated: true,
      canRefresh: hasRefreshToken,
      user: {
        id: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        images: profile.images,
        product: profile.product
      }
    });
  } catch (err) {
    // If access token is expired but refresh token exists, notify client to refresh
    return res.json({
      isAuthenticated: false,
      canRefresh: hasRefreshToken,
      user: null
    });
  }
});

/**
 * POST /logout
 * Clears authentication cookies.
 */
router.post('/logout', (req, res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
  res.clearCookie(STATE_COOKIE_NAME, cookieOptions);
  return res.json({ loggedOut: true });
});

export default router;

