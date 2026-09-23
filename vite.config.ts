import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves this repo at /idxmap-id/ ; every other host (Netlify,
// Cloudflare Pages, Vercel, Lovable) serves it at the domain root. VITE_BASE_PATH
// lets the GH Pages workflow override the default root base without touching
// any other deploy target.
const basePath = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
  },
})
