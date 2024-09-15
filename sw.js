// Service Worker (sw.js)

const CACHE_NAME = 'pwa-notification-cache-v1';
const urlsToCache = [
  'https://severside-json.github.io/webswjsnotification/',  // Thay bằng URL chính xác của trang web bạn
  'https://severside-json.github.io/webswjsnotification/manifest.json',
  'https://severside-json.github.io/webswjsnotification/icon-192x192.png'
];

// Sự kiện cài đặt, lưu trữ các file tĩnh trong cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Sự kiện activate, dọn dẹp các cache cũ
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

// Sự kiện fetch, lấy dữ liệu từ cache nếu có
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

// Sự kiện nhận thông báo đẩy từ máy chủ
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
    icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',  // Thay icon của bạn ở đây
    badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    data: {
      url: notificationData.url || '/'  // Thay URL điều hướng khi người dùng nhấn vào
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

// Xử lý khi người dùng click vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'close') {
    // Không làm gì vì notification đã được đóng
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Xử lý message gửi từ client để hiển thị thông báo lên lịch
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'scheduleNotification') {
    const title = event.data.title || 'Thông báo mới';
    const body = event.data.body || 'Nội dung thông báo';

    self.registration.showNotification(title, {
      body: body,
      icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',  // Thay icon của bạn ở đây
      badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
      data: {
        url: '/'  // Thay URL điều hướng khi người dùng nhấn vào
      },
      actions: [
        { action: 'explore', title: 'Xem chi tiết' },
        { action: 'close', title: 'Đóng' }
      ]
    });
  }
});
