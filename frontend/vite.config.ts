import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: {
      '/api':      { target: 'http://localhost:8080', changeOrigin: true },
      '/actuator': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          if (id.includes('framer-motion'))            return 'motion'
          if (id.includes('@xyflow'))                  return 'flow'
          if (id.includes('@react-three') || id.includes('/three/')) return 'three'
          if (id.includes('@tanstack'))                return 'query'
          return undefined
        },
      },
    },
  },
})
