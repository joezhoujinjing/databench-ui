import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API base is configured at runtime (localStorage 'databench.api_base'),
// defaulting to the current origin. For local dev against a backend on another
// port, the dev server proxies the /v1 domain routes plus the unversioned meta
// routes to it. Override the target with VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8000'

const proxied = ['/v1', '/health', '/version', '/capabilities']

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(
      proxied.map((path) => [path, { target: proxyTarget, changeOrigin: true }]),
    ),
  },
})
