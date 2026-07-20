import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': resolve(__dirname, 'node_modules/react-router-dom'),
      '@reduxjs/toolkit': resolve(__dirname, 'node_modules/@reduxjs/toolkit'),
      'react-redux': resolve(__dirname, 'node_modules/react-redux'),
      '@testing-library/react': resolve(__dirname, 'node_modules/@testing-library/react'),
      '@testing-library/jest-dom': resolve(__dirname, 'node_modules/@testing-library/jest-dom'),
      '@testing-library/user-event': resolve(__dirname, 'node_modules/@testing-library/user-event'),
    }
  },
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