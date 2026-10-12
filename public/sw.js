/**
 * CareBox Family Service Worker (PWA)
 * Caches app shell for offline reliability, isolates API calls,
 * and handles gentle Web Push notifications.
 */

// Versioned cache name tied to app release
const BUILD_VERSION = '2026.10.13-v1';
const CACHE_NAME = `carebox-shell-${BUILD_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/images/mom_avatar.jpg',
  '/images/carebox_qr_scan.jpg',
  '/images/onboarding_family.jpg',
];

// Install: pre-cache essential static app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll skipped missing assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('carebox-'))
          .map((key) => {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch routing strategy:
// 1. NEVER cache Supabase API calls or backend auth/realtime endpoints
// 2. Navigation / HTML: Network-first, fall back to cached /index.html
// 3. Static assets (JS, CSS, images, fonts): Cache-first, fall back to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Guard: NEVER cache Supabase API responses or external API endpoints
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/v1') ||
    url.pathname.startsWith('/auth/v1') ||
    url.pathname.startsWith('/realtime/v1') ||
    url.pathname.startsWith('/functions/v1')
  ) {
    return; // Pass through straight to network
  }

  // Navigation requests: Network-First
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html') as Promise<Response>)
    );
    return;
  }

  // Static assets (scripts, styles, images, fonts): Cache-First
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request) as Promise<Response>)
  );
});

// Push: Gentle, dignified notification display
self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; icon?: string; tag?: string; url?: string } = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.warn('[SW] Error parsing push data payload:', e);
  }

  const title = data.title || 'CareBox Family';
  const options = {
    body: data.body || 'Medication adherence update.',
    icon: data.icon || '/logo.svg',
    badge: '/logo.svg',
    tag: data.tag || 'carebox-dose',
    renotify: false,
    silent: false,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: Focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
