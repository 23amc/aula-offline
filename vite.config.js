import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  worker: { format: 'es' },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'EduGo',
        short_name: 'EduGo',
        description: 'Aprender sin conexión',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        // El motor de IA pesa varios MB: solo lo descarga quien activa la IA avanzada.
        globIgnores: ['**/motorIA-*.js', '**/ia.worker-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(motorIA|ia\.worker)-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'motor-ia', expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
})