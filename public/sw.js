// Hindi Flashcards — Service Worker v2
// Cache-first static, network-first API, auto-update notification

const CACHE_VERSION = 2;
const CACHE_NAME = `hindi-flashcards-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// INSTALL: pre-cache + skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching v' + CACHE_VERSION);
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: clean old caches + notify all tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith('hindi-flashcards-') && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    ).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
      });
    })
  );
  self.clients.claim();
});

// FETCH
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (!url.origin.includes(self.location.origin) &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) return;

  // Network-first for Firebase
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('identitytoolkit')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((r) => {
        const c = r.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, c));
        return r;
      }).catch(() => caches.match(request).then((c) => c || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Cache-first for static
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(req) {
  const c = await caches.match(req);
  if (c) return c;
  try {
    const r = await fetch(req);
    if (r.ok) { const cache = await caches.open(CACHE_NAME); cache.put(req, r.clone()); }
    return r;
  } catch { return new Response('Offline', { status: 503 }); }
}

async function networkFirst(req) {
  try { return await fetch(req); }
  catch { return (await caches.match(req)) || new Response('Offline', { status: 503 }); }
}
