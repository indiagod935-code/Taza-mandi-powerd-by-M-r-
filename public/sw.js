// ताज़ाMandi Service Worker v58 — Always Network-First for Instant 1-Refresh Updates
const CACHE_NAME = 'tazamandi-cache-v58';
const PRECACHE_URLS = [
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // Always activate newest Service Worker immediately so 1 refresh updates to latest version
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Precache partial fallback:', err);
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Pass through non-GET, API, downloads, and Vite dev/HMR/source modules directly without caching
  if (
    event.request.method !== 'GET' ||
    url.includes('/api/') ||
    url.includes('/downloads/') ||
    url.includes('/src/') ||
    url.includes('/@vite') ||
    url.includes('/@fs/') ||
    url.includes('/node_modules/')
  ) {
    return;
  }

  // Strictly network no-store for HTML / navigation so refresh NEVER serves an old cached version
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Network-first with no-store fallback to cache only when offline
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        if (
          networkResponse &&
          (networkResponse.status === 200 || networkResponse.status === 0) &&
          (url.endsWith('.png') || url.endsWith('.svg') || url.endsWith('.ico') || url.endsWith('manifest.json'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || event.notification?.data?.action || 'voice_listen';
  const targetUrl =
    action === 'confirm_order'
      ? '/?quick_action=confirm_order'
      : '/?quick_action=voice_listen';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            await client.focus();
          } catch {}
          client.postMessage({ type: 'TAZAMANDI_QUICK_ACTION', action });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
