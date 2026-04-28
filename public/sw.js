// GoBron Admin Service Worker
const CACHE_NAME = 'gobron-admin-v1';
const RUNTIME_CACHE = 'gobron-runtime-v1';

// Cache qilinadigan static fayllar
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - static fayllarni cache qilish
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - eski cache'larni tozalash
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network First strategiya
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API so'rovlarini cache qilmaslik
  if (url.pathname.startsWith('/api') || url.origin.includes('gobronapi')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static fayllar uchun Cache First
  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          return caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Boshqa so'rovlar uchun Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Faqat GET so'rovlarni cache qilish
        if (request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline bo'lsa cache'dan qaytarish
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Agar cache'da yo'q bo'lsa, offline sahifani qaytarish
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'GoBron Admin', body: event.data.text() };
    }
  }

  const title = data.title || 'GoBron Admin';
  const options = {
    body: data.body || 'Yangi bildirishnoma',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'gobron-notification',
    requireInteraction: false,
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Agar ochiq window bo'lsa, uni focus qilish
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Aks holda yangi window ochish
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event (offline bo'lganda ma'lumotlarni yuborish)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Bu yerda offline bo'lganda saqlangan ma'lumotlarni yuborish logikasi
  console.log('[SW] Syncing bookings...');
}

// Periodic background sync (har 24 soatda)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-bookings') {
    event.waitUntil(updateBookings());
  }
});

async function updateBookings() {
  console.log('[SW] Periodic sync: updating bookings');
}

console.log('[SW] Service Worker loaded');
