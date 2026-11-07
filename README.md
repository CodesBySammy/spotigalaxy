# 🌌 SpotiGalaxy

> A real-time 3D audio visualizer connecting Spotify Web API and LRCLIB into living, interactive WebGL constellations.

---

## 🌌 Overview

**SpotiGalaxy** transforms your Spotify listening experience into an interactive cosmic journey:
- **3D Spatial Lyrical Mapping**: Every lyric line in a track becomes a luminous star positioned along your choice of celestial geometry:
  - **Spiral**: Archimedean cosmic helix curling through deep space.
  - **Ring**: Orbital planetary rings with celestial tilt.
  - **Sphere**: Fibonacci golden-ratio supernova lattice.
- **Single GPU Draw Call**: All constellation stars rendered via `InstancedMesh` with micro-harmonic floating and interactive pointer inspection.
- **Progressive Line Connections**: As your music plays, glowing constellation lines dynamically connect star to star in real-time.
- **Audio-Reactive Vibe Aura**: Inset responsive borders pulse to Spotify Audio Features (**Valence**, **Energy**, and **Tempo BPM**).
- **Cinematic Follow Camera**: The camera smoothly glides and tracks active lyrics with gentle vector lerping, or switches to manual 360° orbit mode.
- **Zen Wallpaper Mode**: Press **`H`** anytime to hide all HUD chrome for a distraction-free ambient cosmic visualizer.
- **Smart LRCLIB Engine with Fallback**: Uses the free, open-source LRCLIB database for sub-second synced lyrics. If a song is instrumental or lyrics are unavailable, it seamlessly switches to **Audio Reactive Constellation Mode**.

---

## 🛠️ Architecture & Tech Stack

```
                               ┌──────────────────────────┐
                               │   Spotify Web API        │
                               │   (Playback + Features)  │
                               └────────────┬─────────────┘
                                            │ OAuth 2.0 / Polling
                                            ▼
┌──────────────────┐            ┌──────────────────────────┐
│   LRCLIB API     │◄───────────┤   Express Backend        │
│   (Synced LRC)   │  HTTP /    │   (/server)              │
│                  │  In-Memory │   • Auth & Cookie Store  │
└──────────────────┘  Cache     │   • LRC Parser & Cache   │
                                └────────────┬─────────────┘
                                             │ JSON API (Proxy)
                                             ▼
                                ┌──────────────────────────┐
                                │   React 18 + Vite Client │
                                │   (/client)              │
                                │   • Zustand Global Store │
                                │   • High-Precision Clock │
                                │   • Tailwind CSS HUD     │
                                └────────────┬─────────────┘
                                             │ Three.js Canvas
                                             ▼
                                ┌──────────────────────────┐
                                │   @react-three/fiber     │
                                │   • 3D Star Nodes        │
                                │   • Glowing Lines        │
                                │   • 3D Billboard Text    │
                                │   • Cinematic Camera Lerp│
                                └──────────────────────────┘
```

### Backend (`/server`)
- **Runtime**: Node.js & Express (ES Modules)
- **Authentication**: Spotify OAuth 2.0 Authorization Code flow with HTTP-only cookies
- **APIs**: Spotify Web API (`/v1/me/player/currently-playing`, `/v1/audio-features`), LRCLIB API (`/api/get`, `/api/search`)
- **Parser**: Custom regex-based sub-second `.lrc` timestamp parser with millisecond precision
- **Cache**: `node-cache` in-memory TTL caching for audio features and lyrics

### Frontend (`/client`)
- **Framework**: React 18+ with TypeScript & Vite
- **3D Graphics Engine**: Three.js, `@react-three/fiber`, and `@react-three/drei`
- **State Management**: Zustand
- **Styling**: Tailwind CSS & dynamic CSS custom properties
- **Synchronization**: Polling hook + `requestAnimationFrame` millisecond interpolation with drift compensation

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later)
- A Spotify account (Free or Premium)
- A registered Spotify App on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

### 2. Spotify App Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and click **Create App**.
2. Set **App Name** (e.g. `Lyrical Constellation` — avoid starting with the reserved word "Spotify").
3. Set **Redirect URI** to:
   ```
   http://127.0.0.1:5000/callback
   ```
   *(Note: Spotify's dashboard requires `127.0.0.1` instead of `localhost` for secure loopback).*
4. Check **Web API** under "Which APIs are you planning to use?".
5. Save the app, then go to **Settings** and copy your **Client ID** and **Client Secret**.

### 3. Server Configuration
Create a `.env` file in `/server`:
```bash
cp server/.env.example server/.env
```
Fill in your credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/callback
COOKIE_SECRET=any_random_secure_32_character_string
```

### 4. Client Configuration
Create a `.env` file in `/client`:
```bash
cp client/.env.example client/.env
```

### 5. Installation & Running

Install dependencies and start both backend and frontend:

#### Root (Concurrent dev mode):
```bash
npm install
npm run dev
```

Or run them individually in separate terminals:

#### Server:
```bash
cd server
npm install
npm run dev
```

#### Client:
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎵 Edge Cases & Fallbacks

1. **Unauthenticated Session**:
   Displays a sleek, responsive landing page with a direct "Connect with Spotify" OAuth button.
2. **Spotify Idle / Paused**:
   When no track is active, the app displays a calming idle starfield with the message: *"Play a track on Spotify to begin."*
3. **Lyrics Unavailable / Instrumental Tracks**:
   When LRCLIB returns 404 or flags the song as instrumental, the visualizer automatically transitions into **Audio Reactive Mode**. Rhythmic harmonic anchor nodes are generated procedurally based on tempo, energy, and key, accompanied by a toast alert.
4. **Drift & Latency Correction**:
   The polling hook cross-references Spotify's server timestamp with the browser's high-resolution `performance.now()`, interpolating smoothly between 3-second poll intervals without jarring jumps.
5. **Token Expiry**:
   Silent token refresh occurs automatically in the background when receiving 401 statuses without interrupting visual playback.

---

## 📜 License
MIT License. Free and Open Source.

