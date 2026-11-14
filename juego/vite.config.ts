import { defineConfig } from 'vite';

// base relativa: el build funciona en GitHub Pages, Netlify o cualquier hosting estático.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000, // Phaser pesa ~1.2 MB minificado; va en su propio chunk
    rollupOptions: {
      output: { manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) },
    },
  },
});
