import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative assets loading for GitHub Pages and static hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
