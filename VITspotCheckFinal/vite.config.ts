import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or @vitejs/plugin-vue if using Vue

export default defineConfig({
  plugins: [react()],
  // Replace 'VITspotCheckFinal' with your exact GitHub repository name
  base: '/VITspotCheckFinal/', 
})
