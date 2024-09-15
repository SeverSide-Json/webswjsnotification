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

self.addEventListener('push', (event) => {
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
      notificationData = {...notificationData, ...event.data.json()};
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

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Nếu người dùng click vào notification mà không chọn action cụ thể
    event.waitUntil(
      clients.openWindow('https://severside-json.github.io/webswjsnotification/')
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('[Service Worker] Received notification request from the page');
    self.registration.showNotification(event.data.title, event.data.options);
  }
});
