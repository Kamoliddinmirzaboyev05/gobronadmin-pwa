// GoBron Admin Service Worker - Production Ready v2.0
// 2026 PWA Best Practices

const VERSION = '2.0.0';
const CACHE_NAME = `gobron-admin-v${VERSION}`;
const RUNTIME_CACHE = `gobron-runtime-v${VERSION}`;
const IMAGE_CACHE = `gobron-images-v${VERSION}`;
const API_CACHE = `gobron-api-v${VERSION}`;

// Static assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// API endpoints that can be cached
const CACHEABLE_API_PATTERNS = [
  /\/api\/admin\/dashboard\/stats/,
  /\/api\/admin\/fields/,
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  images: 100,
  runtime: 50,
  api: 30,
};

// Cache duration (in seconds)
const CACHE_DURATION = {
  images: 30 * 24 * 60 * 60, // 30 days
  runtime: 7 * 24 * 60 * 60,  // 7 days
  api: 5 * 60,                 // 5 minutes
};

// ============================================
// INSTALL EVENT - Precache static assets
// ============================================
self.addEventListener('install', (event) => {
  console.log(`[SW v${VERSION}] Installing...`);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_ASSETS);
        console.log(`[SW v${VERSION}] Precached ${PRECACHE_ASSETS.length} assets`);
      } catch (error) {
        console.error('[SW] Precache failed:', error);
      }
      
      // Force activation
      await self.skipWaiting();
    })()
  );
});

// ============================================
// ACTIVATE EVENT - Cleanup old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log(`[SW v${VERSION}] Activating...`);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE];
      
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName) && cacheName.startsWith('gobron-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Take control of all clients
      await self.clients.claim();
      console.log(`[SW v${VERSION}] Activated and claimed clients`);
    })()
  );
});

// ============================================
// FETCH EVENT - Smart caching strategies
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Route to appropriate strategy
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request, url));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// ============================================
// REQUEST HANDLERS
// ============================================

// API Request Handler - Network First with cache fallback
async function handleAPIRequest(request, url) {
  const cacheable = CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (!cacheable) {
    // Don't cache sensitive API calls
    return fetch(request);
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
      
      // Cleanup old entries
      await limitCacheSize(API_CACHE, MAX_CACHE_SIZE.api);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving API from cache (offline):', url.pathname);
      return cached;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Internet yo\'q' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image Request Handler - Cache First
async function handleImageRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
      
      // Cleanup old entries
      await limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE.images);
    }
    
    return response;
  } catch (error) {
    // Return placeholder image
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="16">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Static Asset Handler - Stale While Revalidate
async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
      
      await limitCacheSize(RUNTIME_CACHE, MAX_CACHE_SIZE.runtime);
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// Navigation Request Handler - Network First with cache fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page
    const offlinePage = await caches.match('/index.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isAPIRequest(url) {
  return url.pathname.startsWith('/api') || 
         url.hostname.includes('gobronapi');
}

function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

function isStaticAsset(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'font' ||
         /\.(js|css|woff2?|ttf|eot)$/i.test(request.url);
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const deleteCount = keys.length - maxSize;
    await Promise.all(
      keys.slice(0, deleteCount).map(key => cache.delete(key))
    );
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = { title: 'GoBron Admin', body: 'Yangi bildirishnoma' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body || 'Yangi bildirishnoma',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag || 'gobron-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Ochish', icon: '/icon-96.png' },
      { action: 'close', title: 'Yopish', icon: '/icon-96.png' }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    silent: false,
    renotify: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'GoBron Admin', options)
  );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  } else if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncBookings() {
  try {
    console.log('[SW] Syncing bookings...');
    // Implement your sync logic here
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

async function syncOfflineActions() {
  try {
    console.log('[SW] Syncing offline actions...');
    // Implement your offline actions sync here
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Offline actions sync failed:', error);
    throw error;
  }
}

// ============================================
// PERIODIC BACKGROUND SYNC
// ============================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-bookings') {
    event.waitUntil(updateBookings());
  }
});

async function updateBookings() {
  try {
    console.log('[SW] Periodic update: bookings');
    // Implement periodic update logic
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Periodic update failed:', error);
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  } else if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

console.log(`[SW v${VERSION}] Service Worker loaded and ready`);
