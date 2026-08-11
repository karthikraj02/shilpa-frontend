import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_API_BASE_URL } from './src/config/apiDefaults.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = path.dirname(fileURLToPath(import.meta.url))
  const env = loadEnv(mode, rootDir, '')
  const apiTarget = env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allows mobile devices to connect
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  }
})
