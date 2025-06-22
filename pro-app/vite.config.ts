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
      registerType: 'autoUpdate',  // Utiliser autoUpdate pour une meilleure expérience
      injectRegister: 'auto',
      // En mode développement, utiliser le service worker généré automatiquement au lieu d'un fichier personnalisé
      // pour éviter les erreurs d'évaluation du script
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png', 'icons/*.svg', 'assets/*'],
      // Configuration du Service Worker
      strategies: 'generateSW', // Utiliser generateSW en développement pour éviter les erreurs
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
          // Utilisation des nouvelles icônes SVG qui remplacent les PNG corrompus
          {
            src: 'icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
