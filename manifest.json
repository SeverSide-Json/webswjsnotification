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
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Thông báo mới',
      body: event.data ? event.data.text() : 'Không có nội dung'
    };
  }

  const options = {
    body: notificationData.body,
    icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    data: {
      url: notificationData.url || 'https://severside-json.github.io/webswjsnotification/'
    },
    actions: [
      {
        action: 'explore',
        title: 'Xem chi tiết'
      },
      {
        action: 'close',
        title: 'Đóng'
      }
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
  } else if (event.action === 'close') {
    // Không cần làm gì thêm vì notification đã được đóng
  } else {
    // Nếu người dùng click vào notification mà không chọn action cụ thể
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'scheduleNotification') {
    const delay = event.data.delay || 6000; // Mặc định là 6 giây nếu không có delay được chỉ định
    scheduleNotification(delay);
  }
});

function scheduleNotification(delay) {
  setTimeout(() => {
    self.registration.showNotification('Thông báo tự động', {
      body: 'Đây là thông báo tự động sau khi bạn đăng ký.',
      icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      data: {
        url: 'https://severside-json.github.io/webswjsnotification/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Xem chi tiết'
        },
        {
          action: 'close',
          title: 'Đóng'
        }
      ]
    });
  }, delay);
}
