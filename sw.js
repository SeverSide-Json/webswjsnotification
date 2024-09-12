// sw.js

const CACHE_NAME = 'my-site-cache-v1'; // Bạn có thể đổi tên này theo ý muốn
const urlsToCache = [
  'https://severside-json.github.io/notification/',
  'https://severside-json.github.io/notification/notifications.json',
  'https://severside-json.github.io/notification/icon-192x192.png'
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
    fetch('https://severside-json.github.io/webswjsnotificatio/manifest.json')
      .then(response => response.json())
      .then(data => {
        const notification = data.notifications[0];
        
        return self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          vibrate: notification.vibrate,
          data: notification.data,
          actions: notification.actions
        });
      })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://severside-json.github.io/webswjsnotification/index.html')
    );
  } else if (event.action === 'close') {
    // Notification đã được đóng, không cần làm gì thêm
  } else {
    event.waitUntil(
      clients.openWindow('https://severside-json.github.io/webswjsnotification/index.html')
    );
  }
});
