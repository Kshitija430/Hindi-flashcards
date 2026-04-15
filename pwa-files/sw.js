// ============================================================
// Hindi Flashcards — Service Worker
// Cache-first for static assets, network-first for API/data
// ============================================================

const CACHE_NAME = 'hindi-flashcards-v1';
const OFFLINE_URL = '/offline.html';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ——— INSTALL: Pre-cache core assets ———
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately, don't wait for old SW to die
  self.skipWaiting();
});

// ——— ACTIVATE: Clean up old caches ———
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// ——— FETCH: Smart caching strategy ———
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extensions, external origins we don't control
  if (!url.origin.includes(self.location.origin) &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Network-first for Firebase/API requests (Firestore, Auth)
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('identitytoolkit')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for HTML navigation requests (always get fresh page)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh HTML
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images, icons)
  event.respondWith(cacheFirst(request));
});

// ——— Cache-first strategy ———
// Try cache, fall back to network, cache the network response
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // For non-navigation requests, just return a simple error
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// ——— Network-first strategy ———
// Try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
