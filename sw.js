const CACHE_NAME = 'pwa-google-sheets-v1';
const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c';
const SHEET_TITLE = 'Sheet3'; // Thay đổi nếu cần
const SHEET_RANGE = 'B2:E'; // Cập nhật phạm vi từ B2:E để bắt đầu từ hàng 2 và lấy các cột B, C, D, E
const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;
let lastData = null;

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
      startLongPolling();
    })
  );
});

function startLongPolling() {
  fetchSheetData();
}

async function fetchSheetData() {
  try {
    const response = await fetch(FULL_URL);
    const text = await response.text();
    const data = JSON.parse(text.substring(47).slice(0, -2));
    
    if (data && data.table && data.table.rows) {
      const formattedData = data.table.rows.map(row => row.c.map(cell => cell ? cell.v : ''));
      
      if (JSON.stringify(formattedData) !== JSON.stringify(lastData)) {
        lastData = formattedData;
        notifyClients(formattedData);
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
  
  scheduleNextPoll();
}

function scheduleNextPoll() {
  setTimeout(fetchSheetData, 1000); // Poll every 1 second
}

function notifyClients(data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NEW_DATA',
        data: data
      });
    });
  });

  self.registration.showNotification('Dữ liệu mới', {
    body: 'Phê Duyệt Ngay',
    icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: self.registration.scope
    },
    actions: [
      { action: 'view', title: 'Xem chi tiết' },
      { action: 'close', title: 'Đóng' }
    ]
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
