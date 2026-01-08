// Service Worker for Push Notifications and Cache Management
const CACHE_VERSION = 'v1';
const CACHE_NAME = `turf-manager-${CACHE_VERSION}`;

// Assets to cache
const STATIC_ASSETS = [
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('turf-manager-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Fetch event - network first for API/dynamic, cache first for static
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Network first for API calls and dynamic content
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    return;
  }
  
  // For HTML pages - always fetch from network
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For static assets - try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        });
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Push notification handling
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New booking notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'view', title: 'View Booking', icon: '/favicon.ico' },
      { action: 'close', title: 'Close', icon: '/favicon.ico' }
    ]
  };

  try {
    const data = event.data ? JSON.parse(event.data.text()) : {};
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Sports Arena', options)
    );
  } catch (e) {
    event.waitUntil(
      self.registration.showNotification('New Booking!', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/bookings'));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Message handler for skip waiting
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
