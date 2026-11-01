import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build works at any path (GitHub Pages project subpath).
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { exclude: ['maplibre-gl'] },
  worker: { format: 'es' },
})
