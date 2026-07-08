import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // VITE_DEPLOY_BASE is set explicitly for GitHub Pages deploys.
  // When unset (CLI publish build / local dev), defaults to '/'.
  base: process.env.VITE_DEPLOY_BASE ?? '/',
});
