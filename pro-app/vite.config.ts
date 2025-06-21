import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',  // Changed from autoUpdate to prompt for more reliability
      injectRegister: 'auto',
      srcDir: 'src',          // Changed from public to src where sw.ts exists
      filename: 'sw.ts',      // Using our custom service worker instead of Firebase one
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png', 'icons/*.svg', 'assets/*'],
      // Configuration du Service Worker
      strategies: 'injectManifest', // Changed to injectManifest to use our custom sw.ts
      devOptions: {
        enabled: true,
        type: 'module',
      },
      // Options pour optimiser l'expérience PWA
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        navigateFallback: 'index.html', // Set explicit fallback to index.html instead of null
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 heures
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/ws/'),
            handler: 'NetworkOnly'
          }
        ]
      },
      // Manifest Web App
      manifest: {
        name: 'GreenSentinel Pro',
        short_name: 'GS Pro',
        description: 'Application professionnelle pour les pompiers GreenSentinel - Suivi des incidents en temps réel',
        theme_color: '#E63946',
        background_color: '#F1FAEE',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        categories: ['business', 'productivity', 'utilities'],
        screenshots: [
          {
            src: 'screenshots/dashboard.png',
            sizes: '1170x2532',
            type: 'image/png'
          }
        ],
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
