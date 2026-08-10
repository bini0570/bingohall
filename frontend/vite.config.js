import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode, command }) => {
  const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:4000';

  // When building the admin SPA specifically (BUILD_TARGET=admin)
  const isAdminBuild = process.env.BUILD_TARGET === 'admin';

  return {
    plugins: [react()],

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
