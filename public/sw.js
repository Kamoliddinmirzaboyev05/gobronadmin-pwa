/* ============================================================
   GoBron Admin — Service Worker
   Versiya: 2.0.0
   Imkoniyatlar:
     - Offline cache (Cache-First strategiyasi)
     - Web Push bildirishnomalari
     - Bildirishnomaga bosilganda sahifaga yo'naltirish
   ============================================================ */

const CACHE_NAME = 'gobron-admin-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

// ─── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // yangi SW darhol faollashadi
  );
});

// ─── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        // Eski cache versiyalarini o'chirish
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // barcha tablarni boshqarish
  );
});

// ─── Fetch (Cache-First, fallback to network) ─────────────────
self.addEventListener('fetch', (event) => {
  // Faqat GET so'rovlarini cache qilamiz
  if (event.request.method !== 'GET') return;

  // API so'rovlarini cache qilmaymiz
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Muvaffaqiyatli javobni cache ga saqlaymiz
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: HTML so'rovlari uchun index.html qaytaramiz
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ─── Push Notification ────────────────────────────────────────
self.addEventListener('push', (event) => {
  // Push payload yo'q bo'lsa default xabar
  let data = {
    title: 'GoBron Admin',
    body: 'Yangi bildirishnoma keldi',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
    tag: 'gobron-default',
  };

  // Payload mavjud bo'lsa parse qilamiz
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      // JSON emas bo'lsa text sifatida olamiz
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'gobron-notification',   // bir xil tag = eski xabarni almashtiradi
    renotify: true,                            // bir xil tag bo'lsa ham ovoz chiqaradi
    requireInteraction: false,                 // Android: avtomatik yopiladi
    vibrate: [200, 100, 200],                  // tebranish pattern
    data: { url: data.url || '/' },            // notificationclick uchun URL
    actions: [
      { action: 'open', title: "Ko'rish" },
      { action: 'close', title: 'Yopish' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Notification Click ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // bildirishnomani yopamiz

  const targetUrl = event.notification.data?.url || '/';

  // "Yopish" tugmasi bosilsa hech narsa qilmaymiz
  if (event.action === 'close') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Ilova allaqachon ochiq bo'lsa — fokus beramiz va URL ga o'tamiz
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Ilova yopiq bo'lsa — yangi tab ochamiz
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Push Subscription Change ─────────────────────────────────
// Brauzer subscription ni yangilasa (masalan, muddati tugasa)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
      })
      .then((newSubscription) => {
        // Yangi subscription ni backendga yuboramiz
        return fetch('/api/admin/push/subscribe/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSubscription }),
        });
      })
      .catch((err) => console.warn('[SW] pushsubscriptionchange error:', err))
  );
});
