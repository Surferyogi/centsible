import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` MUST match the GitHub Pages repository name exactly, including case.
// Set for the repository "centsible" (lowercase), published at
// https://surferyogi.github.io/centsible/. If the repo is ever renamed, change
// this line to match or every asset will 404 and the page will load blank.
export default defineConfig({
  base: '/centsible/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ['pdfjs-dist'],
        },
      },
    },
  },
});
