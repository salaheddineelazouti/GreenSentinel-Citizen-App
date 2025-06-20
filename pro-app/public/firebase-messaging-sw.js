// Firebase Messaging Service Worker
// This file must be at the root level of your domain

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.12/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12/firebase-messaging-compat.js');

// Initialize Firebase with the same config as in firebase.ts
firebase.initializeApp({
  apiKey: 'VITE_FIREBASE_API_KEY',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID'
});

// Get an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { notification, data } = payload;
  
  // Show notification using the Notification API
  if (notification) {
    const notificationOptions = {
      body: notification.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-72x72.png',
      data: data || {}
    };
    
    self.registration.showNotification(notification.title, notificationOptions);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();
  
  // Extract incident ID from the notification data
  const incidentId = event.notification.data?.incident_id;
  
  // Open or focus window with the incident details
  if (incidentId) {
    const urlToOpen = new URL(`/incident/${incidentId}`, self.location.origin).href;
    
    // If a window is already open with the URL, focus it
    // Otherwise, open a new window/tab
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // No matching window, open new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
