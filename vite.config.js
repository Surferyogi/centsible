import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` MUST match the GitHub Pages repository name exactly, including case.
// This is set for a repository named "Centsible" published at
// https://surferyogi.github.io/Centsible/. If the repo is named anything else,
// change this line or every asset will 404 on deploy.
export default defineConfig({
  base: '/Centsible/',
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
