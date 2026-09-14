import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ mode, command }) => {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:4000';

  // When building the admin SPA specifically (BUILD_TARGET=admin)
  const isAdminBuild = process.env.BUILD_TARGET === 'admin';

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
          icons: [
            {
              src: '/icon.jpg',
              sizes: '192x192 512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],

    // Root changes per build target:
    //   player: frontend/  (default)
    //   admin:  frontend/admin/
    root: isAdminBuild ? resolve(__dirname, 'admin') : __dirname,

    build: {
      outDir: isAdminBuild
        ? resolve(__dirname, '../backend/admin-dist')
        : resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },

    server: {
      port: isAdminBuild ? 3001 : 3000,
      host: '0.0.0.0',
      proxy: {
        '/api':      { target: 'http://localhost:4000', changeOrigin: true },
        '/uploads':  { target: 'http://localhost:4000', changeOrigin: true },
        '/socket.io':{ target: 'http://localhost:4000', ws: true, changeOrigin: true }
      }
    }
  };
});
