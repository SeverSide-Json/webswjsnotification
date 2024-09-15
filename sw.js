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
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache all resources:', error);
          // Attempt to cache resources individually
          return Promise.all(
            urlsToCache.map(url => {
              return cache.add(url).catch(err => {
                console.error('Failed to cache:', url, err);
              });
            })
          );
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('New service worker activated');
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
        return fetch(event.request).catch(error => {
          console.error('Fetch failed:', error);
          throw error;
        });
      })
  );
});

self.addEventListener('push', (event) => {
  console.log('Push event received', event);

  let notificationData = {
    title: 'New Data Available',
    body: 'Check the app for updates.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  if (event.data) {
    try {
      notificationData = JSON.parse(event.data.text());
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data || {},
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ]
    }).catch(error => {
      console.error('Failed to show notification:', error);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received', event);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/').catch(error => {
        console.error('Failed to open window:', error);
      })
    );
  }
});

self.addEventListener('message', (event) => {
  console.log('Message received', event.data);

  if (event.data && event.data.type === 'NEW_DATA') {
    const newData = event.data.data;
    const notificationTitle = 'New Data Available';
    const notificationOptions = {
      body: `${newData.length} new entries added`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: '/'
      },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions)
      .catch(error => {
        console.error('Failed to show notification:', error);
      });
  }
});

// Function to check if a resource exists
function checkResource(url) {
  return fetch(url, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      return true;
    })
    .catch(error => {
      console.error(`Resource check failed for ${url}:`, error);
      return false;
    });
}

// Check all resources on service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all(
      urlsToCache.map(url => checkResource(url))
    ).then(results => {
      const failedResources = urlsToCache.filter((url, index) => !results[index]);
      if (failedResources.length > 0) {
        console.error('Failed to verify these resources:', failedResources);
      } else {
        console.log('All resources verified successfully');
      }
    })
  );
});
