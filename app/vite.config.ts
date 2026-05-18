import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Cloudflare Pages SPA fallback: copy index.html → 404.html so unmatched
// routes are handled client-side instead of showing a CF 404 page.
function cloudflarePagesSpa() {
  return {
    name: 'cloudflare-pages-spa',
    closeBundle() {
      const dist = path.resolve('dist');
      const src = path.join(dist, 'index.html');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(dist, '404.html'));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), cloudflarePagesSpa()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
