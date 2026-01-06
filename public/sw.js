// Service Worker for Push Notifications
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
    event.waitUntil(
      clients.openWindow('/bookings')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});