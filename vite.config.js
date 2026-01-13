import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/textarbeit-app/', // GitHub Pages base path
  server: {
    host: true, // Listen on all local IP addresses
  },
})
