// sw.js
const CACHE_NAME = 'pwa-notification-cache-v1';
const urlsToCache = [
  'https://severside-json.github.io/webswjsnotification/',
  'https://severside-json.github.io/webswjsnotification/manifest.json',
  'https://severside-json.github.io/webswjsnotification/icon-192x192.png'
];

// Caching resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Handling fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = { title: 'Thông báo mới', body: event.data.text() };
  }

  const options = {
    body: notificationData.body,
    icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Receive message from the page to trigger push notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'sendPushNotification') {
    self.registration.showNotification('Dữ liệu mới', {
      body: event.data.message,
      icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png'
    });
  }
});
