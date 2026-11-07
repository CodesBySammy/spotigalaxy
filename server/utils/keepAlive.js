/**
 * @file keepAlive.js
 * @description Automatic Keep-Alive Heartbeat for Render & Cloud Free-Tier Hosts.
 * Render automatically spins down free instances after 15 minutes of inactivity.
 * This worker sends an external HTTP request to /api/health every 13 minutes,
 * keeping the service continuously warm 24/7 without cold starts.
 */

import axios from 'axios';

/**
 * Initializes the self-pinging keep-alive service.
 */
export function initKeepAlive() {
  // Render automatically injects RENDER_EXTERNAL_URL in production (e.g. https://my-service.onrender.com)
  const externalUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    process.env.BACKEND_URL;

  if (!externalUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.log('ℹ️ [KeepAlive] No RENDER_EXTERNAL_URL or BACKEND_URL detected. To keep Render awake, ensure RENDER_EXTERNAL_URL or SERVER_URL is set.');
    }
    return;
  }

  const cleanUrl = externalUrl.replace(/\/+$/, '');
  const healthUrl = `${cleanUrl}/api/health`;
  const INTERVAL_MS = 13 * 60 * 1000; // 13 minutes (Render sleeps at 15m)

  console.log(`💓 [KeepAlive] Service active. Target: ${healthUrl} (pinging every 13 min)`);

  const ping = async () => {
    try {
      const start = Date.now();
      const res = await axios.get(healthUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SpotiGalaxy-KeepAlive/1.0' }
      });
      const duration = Date.now() - start;
      console.log(`[KeepAlive] Heartbeat ping OK (${res.status}) - ${duration}ms at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.warn(`[KeepAlive] Heartbeat ping warning: ${err.message}`);
    }
  };

  // Initial verification ping 45s after boot
  setTimeout(ping, 45000);

  // Periodic recurring ping
  const timer = setInterval(ping, INTERVAL_MS);

  // Unref timer so it doesn't block process exit
  if (timer.unref) {
    timer.unref();
  }
}

export default initKeepAlive;
