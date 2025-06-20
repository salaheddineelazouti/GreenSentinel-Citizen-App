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
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      srcDir: 'public',
      filename: 'firebase-messaging-sw.js',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png', 'assets/*'],
      // Configuration du Service Worker pour Firebase Messaging
      strategies: 'generateSW',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      // Options pour optimiser l'expérience PWA
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        navigateFallback: null,
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
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
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
