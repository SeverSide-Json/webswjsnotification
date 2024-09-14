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

self.addEventListener('push', (event) => {
  let notificationData = {};

  try {
      notificationData = event.data.json(); // Xử lý nếu dữ liệu push là JSON
  } catch (e) {
      // Nếu không có dữ liệu JSON, sử dụng nội dung mặc định
      notificationData = {
          title: 'Thông báo mới',
          body: 'Phê duyệt ngay'  // Đặt nội dung mặc định là "Phê duyệt ngay"
      };
  }

  const options = {
      body: notificationData.body,  // Sử dụng nội dung từ dữ liệu hoặc mặc định
      icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      data: {
          url: notificationData.url || 'https://severside-json.github.io/webswjsnotification/'
      },
      actions: [
          { action: 'explore', title: 'Xem chi tiết' },
          { action: 'close', title: 'Đóng' }
      ]
  };

  event.waitUntil(
      self.registration.showNotification(notificationData.title, options)
  );
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
