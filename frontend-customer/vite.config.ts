import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5193,
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
  preview: { port: 5193 },
});
