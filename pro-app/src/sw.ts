/// <reference lib="webworker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Récupération des ressources précachées depuis le manifest généré par Vite PWA
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Nettoyage du cache pour éviter les problèmes de version
cleanupOutdatedCaches()

// Utilisation de la liste des ressources générées par la build
const manifest = self.__WB_MANIFEST
precacheAndRoute(manifest)

// Gestion spécifique de la page d'index pour la SPA
const handler = createHandlerBoundToURL('index.html') // Remove leading slash for relative path
const navigationRoute = new NavigationRoute(handler, {
  // Exclusion des routes API et WebSocket
  denylist: [/\/api\/.*/, /\/ws\/.*/],
})
registerRoute(navigationRoute)

// Stratégie de cache pour les ressources statiques (images, polices, etc.)
registerRoute(
  ({ request }) => 
    request.destination === 'image' || 
    request.destination === 'font' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
      }),
    ],
  }),
)

// Stratégie spécifique pour les icônes du manifeste (très important pour la PWA)
registerRoute(
  ({ url }) => url.pathname.includes('/icons/'),
  new CacheFirst({
    cacheName: 'icon-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 jours, plus long pour les icônes
      }),
    ],
  }),
)

// Stratégie pour les requêtes API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 jour
      }),
    ],
  }),
)

// Stratégie pour les autres ressources (scripts, etc.)
registerRoute(
  ({ request }) => request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'script-resources',
  }),
)

// Gestion des notifications push
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Nouvel incident'
  const options = {
    body: data.body || 'Un nouvel incident a été signalé',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    data: data.data || {},
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'view',
        title: 'Voir details',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Déclaration des types ServiceWorker pour TypeScript
declare const clients: Clients;

// Gestion des clics sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view' && event.notification.data?.incidentId) {
    event.waitUntil(
      clients.openWindow(`/incidents/${event.notification.data.incidentId}`)
    )
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients: readonly WindowClient[]) => {
        if (windowClients.length > 0) {
          windowClients[0].focus()
        } else {
          clients.openWindow('/')
        }
      })
    )
  }
})
