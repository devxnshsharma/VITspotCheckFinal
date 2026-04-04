import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' 
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react()],
  // Add this base property!
  base: process.env.NODE_ENV === 'production' && !process.env.VERCEL ? '/VITspotCheckFinal/' : '/',
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
