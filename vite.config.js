import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls để bypass CORS trong development
      '/api': {
        target: 'http://159.223.64.31',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
