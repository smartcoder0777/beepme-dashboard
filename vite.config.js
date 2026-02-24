import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true, // listen on 0.0.0.0 so browser can connect (e.g. if localhost resolution differs)
    proxy: {
      '/api': {
        target: 'https://trackerbackend-production-875d.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://trackerbackend-production-875d.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
