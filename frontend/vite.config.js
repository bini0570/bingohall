import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ mode, command }) => {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:4000';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true },
        manifest: {
          name: 'Bingo X',
          short_name: 'BingoX',
          description: 'Live Multiplayer Bingo',
          theme_color: '#0B1120',
          background_color: '#0B1120',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],

    root: __dirname,

    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api':      { target: 'http://localhost:4000', changeOrigin: true },
        '/uploads':  { target: 'http://localhost:4000', changeOrigin: true },
        '/socket.io':{ target: 'http://localhost:4000', ws: true, changeOrigin: true }
      }
    }
  };
});
