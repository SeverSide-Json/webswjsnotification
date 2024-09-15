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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
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

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  let notificationData = {
    title: 'Thông báo mới',
    body: 'Phê Duyệt Ngay',
    icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    data: {
      url: 'https://severside-json.github.io/webswjsnotification/'
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {...notificationData, ...pushData};
    } catch (e) {
      console.error('Không thể parse dữ liệu push:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'view', title: 'Xem Chi Tiết' },
        { action: 'close', title: 'Đóng' }
      ],
      tag: 'renotify',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Nếu không có action cụ thể, mở trang chính
    event.waitUntil(
      clients.openWindow('https://severside-json.github.io/webswjsnotification/')
    );
  }
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('[Service Worker] Received notification request from the page');
    self.registration.showNotification(event.data.title, event.data.options);
  }
});
