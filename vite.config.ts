import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'lazyTracker',
        short_name: 'lazyTracker',
        description: 'Inventory management for small businesses',
        theme_color: '#0A0F1E',
        background_color: '#0A0F1E',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
})
