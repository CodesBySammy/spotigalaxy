/**
 * @file LandingPage.tsx
 * @description Astral landing page when user is unauthenticated.
 */

import React from 'react';
import { Sparkles, Compass, Radio, Disc, ArrowRight, Play } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const LandingPage: React.FC = () => {
  const { setAuth, updatePlayback, setLyrics, addToast } = useStore();

  const handleLogin = () => {
    // Redirect to backend OAuth login endpoint
    window.location.href = '/login';
  };

  const handleLaunchDemo = () => {
    // Pre-seed an astral synthwave demo track with time-synced lyrics
    setAuth(true, {
      id: 'demo-traveler',
      displayName: 'Cosmic Traveler',
      product: 'premium'
    });

    const demoDurationMs = 90000; // 90 seconds demo loop
    const demoTrack = {
      id: 'celestial-demo-track',
      name: 'Constellation Symphony (Cosmic Voyage)',
      artists: ['Nova Echo', 'Stellaris'],
      primaryArtist: 'Nova Echo',
      album: 'Galactic Resonance',
      albumArt: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&auto=format&fit=crop&q=80',
      durationMs: demoDurationMs
    };

    const demoAudioFeatures = {
      valence: 0.85,       // Warm Radiant Rose / Solar Amber
      energy: 0.80,        // High Energy
      tempo: 128.0,        // 128 BPM
      danceability: 0.72,
      acousticness: 0.15,
      instrumentalness: 0.02,
      key: 9,              // A Major
      mode: 1
    };

    const demoLyrics = [
      { time: 2.0, text: "Gazing into the celestial abyss" },
      { time: 8.5, text: "A million stars ignite in timeless bliss" },
      { time: 16.0, text: "Harmonic frequencies weave through the night" },
      { time: 23.5, text: "Every heartbeat glowing with radiant light" },
      { time: 31.0, text: "Listen closely as the cosmos softly hums" },
      { time: 38.5, text: "To the rhythm of the interstellar drums" },
      { time: 46.0, text: "We are travelers born of supernova dust" },
      { time: 54.0, text: "In this cosmic constellation we trust" },
      { time: 62.0, text: "Drifting weightless through the emerald skies" },
      { time: 70.0, text: "Reflecting nebulae within our eyes" },
      { time: 78.0, text: "Across infinity our melodies align" },
      { time: 85.0, text: "Forever dancing in the grand design" }
    ];

    updatePlayback(true, 0, Date.now(), demoTrack, demoAudioFeatures);
    setLyrics({
      synced: true,
      instrumental: false,
      notFound: false,
      lyrics: demoLyrics
    });

    addToast({
      title: 'Cosmic Demo Mode Active',
      message: 'Previewing live 3D constellation with sample time-synced lyrics.',
      type: 'info'
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 overflow-hidden bg-[#020208]">
      {/* Background radial celestial gradients in aesthetic galaxy palette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-900/20 via-purple-900/15 to-sky-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Container */}
      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        {/* Glow Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border-indigo-400/20 text-indigo-300 text-[11px] font-mono uppercase tracking-[0.2em] mb-7 shadow-lg shadow-indigo-500/10">
          <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
          <span>Real-Time 3D Audio Visualizer</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
          Spoti<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300">Galaxy</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-slate-300 max-w-xl mb-9 leading-relaxed font-normal">
          Transform Spotify playback into living cosmic constellations. Every lyric line maps to a celestial star, illuminated in sync with the musical energy, tempo, and valence of your music.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <button
            onClick={handleLogin}
            className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.303c-.217.355-.678.47-1.033.253-2.828-1.728-6.388-2.119-10.58-1.161-.403.093-.807-.16-.9-.564-.093-.404.16-.808.564-.9 4.588-1.048 8.528-.606 11.696 1.339.355.216.47.677.253 1.032zm1.467-3.26c-.274.444-.858.587-1.302.314-3.237-1.99-8.172-2.566-12.001-1.403-.5.152-1.033-.13-1.185-.63-.152-.5.13-1.033.63-1.185 4.38-1.328 9.815-.688 13.544 1.603.444.273.587.857.314 1.301zm.126-3.41c-3.882-2.305-10.288-2.518-13.987-1.394-.596.18-1.229-.158-1.41-.753-.18-.596.158-1.229.754-1.41 4.254-1.291 11.317-1.041 15.792 1.616.536.318.71 1.01.392 1.546-.318.536-1.01.71-1.541.395z" />
            </svg>
            <span>Connect with Spotify</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleLaunchDemo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-panel border-indigo-400/20 text-indigo-300 font-medium text-xs hover:bg-indigo-500/10 hover:text-white transition-all shadow-md shadow-indigo-500/5"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span>Launch Cosmic Demo</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-14 max-w-3xl text-left">
          <div className="glass-panel p-5 rounded-xl border-white/5">
            <Compass className="w-6 h-6 text-sky-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-100 mb-1.5">3D Spatial Mapping</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Lyrics are mapped along compact celestial spirals. Smooth camera transitions glide through each lyrical star node.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border-white/5">
            <Radio className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-100 mb-1.5">Audio Valence & Energy</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ambient borders, star colors, and pulse frequencies react in real-time to Spotify's audio analysis.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-xl border-white/5">
            <Disc className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-100 mb-1.5">Synced LRCLIB Engine</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sub-second precision lyric timing backed by the open-source LRCLIB database, with audio-reactive fallback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

