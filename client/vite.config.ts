import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'zustand', '@react-three/fiber', '@react-three/drei'],
          'vendor-three': ['three'],
          'vendor-icons': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/callback': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/refresh_token': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/logout': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

