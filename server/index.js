/**
 * @file index.js
 * @description Main Express application server for Lyrical Constellation.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import spotifyRouter from './routes/spotify.js';
import lyricsRouter from './routes/lyrics.js';
import { initKeepAlive } from './utils/keepAlive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Handled per-environment for WebGL/CDN
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false
}));

// Rate limiting middleware for production resiliency
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Rate limit exceeded. Please wait a moment.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 45, // 45 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many authentication attempts. Try again later.' }
});

app.use('/api', apiLimiter);
app.use(['/login', '/callback', '/refresh_token'], authLimiter);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  CLIENT_URL
].filter(Boolean);

// Middleware configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'lyrical-secret-key'));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SpotiGalaxy Server',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Authentication routes (/login, /callback, /refresh_token, /logout, /api/auth/status)
app.use('/', authRouter);

// Spotify data routes (/api/now-playing)
app.use('/api', spotifyRouter);

// Lyrics routes (/api/lyrics)
app.use('/api/lyrics', lyricsRouter);

// In production, serve built client static assets if present (monorepo mode)
// or serve a clean API landing/redirect in standalone backend mode (Render/Railway)
const clientDistPath = path.join(__dirname, '../client/dist');
const indexHtmlPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (
      req.url.startsWith('/api') ||
      req.url.startsWith('/login') ||
      req.url.startsWith('/callback') ||
      req.url.startsWith('/refresh_token') ||
      req.url.startsWith('/logout')
    ) {
      return next();
    }
    res.sendFile(indexHtmlPath);
  });
} else {
  // Standalone API Mode: root endpoint returns service info or redirects to active frontend
  app.get('/', (req, res) => {
    if (
      CLIENT_URL &&
      !CLIENT_URL.includes('localhost') &&
      !CLIENT_URL.includes('127.0.0.1') &&
      !CLIENT_URL.includes('your-frontend.vercel.app')
    ) {
      return res.redirect(CLIENT_URL);
    }
    res.json({
      service: 'SpotiGalaxy API Server',
      status: 'online',
      clientUrl: CLIENT_URL,
      endpoints: ['/api/health', '/api/now-playing', '/api/lyrics', '/login', '/callback']
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    error: 'InternalServerError',
    message: err.message || 'An unexpected error occurred.'
  });
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`✨ SpotiGalaxy Server running on http://localhost:${PORT}`);
  console.log(`🔗 Configured Client URL: ${CLIENT_URL}`);
  // Initialize self-ping keep-alive heartbeat for cloud platforms like Render
  initKeepAlive();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
    console.error(`\n❌ Port ${PORT} is unavailable (${err.code}). If an existing process is using it, please terminate it or check server/.env.\n`);
  } else {
    console.error('[Server Error]:', err);
  }
});

// Guard against unhandled promise rejections and uncaught exceptions crashing Node process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Promise Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

export default app;

