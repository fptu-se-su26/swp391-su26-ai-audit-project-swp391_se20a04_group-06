import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['../tests/frontend/**/*.test.{js,jsx,ts,tsx}'],
  },
  server: {
    fs: {
      allow: ['..']
    },
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'erasable-curing-growl.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok-free.dev',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
