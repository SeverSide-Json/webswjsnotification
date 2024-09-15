// sw.js

const CACHE_NAME = 'pwa-notification-cache-v1';
const urlsToCache = [
  'https://severside-json.github.io/webswjsnotification/',
  'https://severside-json.github.io/webswjsnotification/manifest.json',
  'https://severside-json.github.io/webswjsnotification/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('push', function(event) {
  if (event.data) {
    const pushData = event.data.json();
    const options = {
      body: 'Phê Duyệt Ngay Nhé', // Nội dung mặc định
      icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      image: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      vibrate: [100, 50, 100],
      tag: 'important-notification',
      renotify: true,
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      data: {
        url: pushData.url || 'https://severside-json.github.io/webswjsnotification/'
      },
      actions: [
        { action: 'view', title: 'Xem Chi Tiết' },
        { action: 'close', title: 'Đóng' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(pushData.title || 'Thông báo mới', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || 'Thông báo mới';
    const options = {
      ...event.data.options,
      body: 'Phê Duyệt Ngay' // Luôn sử dụng nội dung mặc định
    };
    self.registration.showNotification(title, options);
  }
});
