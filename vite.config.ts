import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API base defaults to '/api', which is proxied to the FastAPI backend in dev.
// Override the backend target with VITE_PROXY_TARGET if it runs elsewhere.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
