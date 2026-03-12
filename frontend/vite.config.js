import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ve temel kütüphaneleri bir dosyaya ayır
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
          // İkonları ayrı bir dosyaya koy
          icons: ['lucide-react'],
          // En ağır olan QR okuyucuyu tek başına paketle
          qrcode: ['html5-qrcode']
        }
      }
    }
  }
})