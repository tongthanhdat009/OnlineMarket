import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Don't load local `.env` under `vitest` (mode === 'test'): a dev-only
  // VITE_API_URL=http://localhost:7000 would leak into unit tests while
  // CI/fresh clones see the empty default. Test isolation, not app behavior.
  envDir: mode === 'test' ? false : undefined,
  server: {
    host: '127.0.0.1',
    port: 5188,
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5188 },
}));
