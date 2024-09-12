// sw.js

const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
  'https://severside-json.github.io/webswjsnotification/',
  'https://severside-json.github.io/webswjsnotification/manifest.json',
  'https://severside-json.github.io/webswjsnotification/icon-192x192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('push', event => {
  event.waitUntil(
    fetch('https://severside-json.github.io/webswjsnotification/manifest.json')
      .then(response => response.json())
      .then(manifest => {
        const pushData = event.data ? event.data.json() : {};
        const notificationOptions = manifest.notifications[pushData.type] || manifest.notifications.default;

        return self.registration.showNotification(notificationOptions.title, {
          body: pushData.message || notificationOptions.body,
          icon: notificationOptions.icon,
          badge: notificationOptions.badge,
          data: notificationOptions.data,
          actions: notificationOptions.actions
        });
      })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const notificationData = event.notification.data;
  let url = 'https://severside-json.github.io/webswjsnotification/';

  if (notificationData && notificationData.url) {
    url = notificationData.url;
  }

  if (event.action) {
    console.log('Notification action clicked:', event.action);
    // Thêm xử lý cho các hành động cụ thể nếu cần
  }

  event.waitUntil(
    clients.openWindow(url)
  );
});
