// sw.js
const CACHE_NAME = 'pwa-notification-cache-v1';
const urlsToCache = [
    'https://severside-json.github.io/webswjsnotification/',
    'https://severside-json.github.io/webswjsnotification/manifest.json',
    'https://severside-json.github.io/webswjsnotification/icon-192x192.png'
];

let lastFetchedData = null; // To store the last fetched data for comparison
const SHEET_ID = '1Zebh-8FerNoGurfyqQP-pcSFFT_CXAcnh1I-GFHpv_c'; // Replace with your sheet ID
const SHEET_TITLE = 'Sheet3'; // Replace with your sheet name
const SHEET_COLUMN = 'B2:E'; // Replace with the column you want to monitor
const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&column=${SHEET_COLUMN}`;

// Function to fetch data from Google Sheets
async function fetchData() {
    try {
        const response = await fetch(FULL_URL);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Function to check for new data
async function checkForNewData() {
    const data = await fetchData();
    if (data && data !== lastFetchedData) {
        // New data detected
        lastFetchedData = data; // Update the stored data
        triggerPushNotification(data);
    }
}

// Function to trigger push notification
function triggerPushNotification(data) {
    const title = 'New Data Available';
    const options = {
        body: 'There is new data in the Google Sheet.',
        icon: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
        badge: 'https://severside-json.github.io/webswjsnotification/icon-192x192.png',
        data: {
            url: 'https://severside-json.github.io/webswjsnotification/' // Adjust URL if needed
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    self.registration.showNotification(title, options);
}

// Periodically check for new data (every 1 second)
setInterval(checkForNewData, 1000);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
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
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

// Handle push events
self.addEventListener('push', (event) => {
    let notificationData = {};
    try {
        notificationData = event.data.json();
    } catch (e) {
        notificationData = {
            title: 'New Notification',
            body: event.data ? event.data.text() : 'No content'
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
                title: 'View Details'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    } else if (event.action === 'close') {
        // No further action needed as the notification is already closed
    } else {
        // Default action if user clicks the notification without a specific action
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
