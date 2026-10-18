/**
 * FX English WebApp - PWA Service Worker
 * Provides offline caching, fast App Shell loading, and offline Flashcard review.
 */

const CACHE_NAME = 'fx-english-v1';

// Essential assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/icon.svg',
  '/icons/icon192.png',
  '/icons/icon512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and external chrome-extension requests
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Static Assets (Next.js bundles, Fonts, Icons, Images) -> Cache-First with Network Fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy 2: API routes & HTML pages -> Network-First, with Cache Fallback for offline review
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // When network fails (offline), attempt to serve cached version
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to home page if navigating to a page offline
          if (req.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response(JSON.stringify({ offline: true, error: 'Offline mode active' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
  );
});
