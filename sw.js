// sw.js
const CACHE_NAME = 'pwa-notification-cache-v2';
const urlsToCache = [
  './',  // Cache toàn bộ ứng dụng
  './manifest.json',
  './icon-192x192.png'
];

// Install Service Worker và cache các tài nguyên cần thiết
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Service Worker và dọn dẹp cache cũ
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch các yêu cầu tài nguyên và kiểm tra cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Xử lý push event và hiển thị thông báo
self.addEventListener('push', (event) => {
  const notificationData = {
    title: 'Phê duyệt người dùng', // Nội dung cố định
    body: 'Có người dùng mới cần phê duyệt.',
    icon: './icon-192x192.png', // Icon bạn đã cấu hình trong manifest.json
    badge: './icon-192x192.png'
  };

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: {
      url: 'https://severside-json.github.io/webswjsnotification/index.html'  // URL mặc định khi click vào thông báo
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

// Xử lý khi người dùng click vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
