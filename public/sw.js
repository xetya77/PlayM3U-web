// ─── PlayM3U Service Worker ───────────────────────────────────────────────────
const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `playm3u-static-${CACHE_VERSION}`;
const PLAYLIST_CACHE = `playm3u-playlists-${CACHE_VERSION}`;
const OFFLINE_URL    = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PLAYLIST_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't intercept non-GET or cross-origin API calls
  if (request.method !== 'GET') return;

  // M3U playlist requests → network-first, cache fallback
  if (url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.m3u')) {
    event.respondWith(networkFirstPlaylist(request));
    return;
  }

  // App shell (same origin) → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('Offline', { status: 503 });
  }
}

async function networkFirstPlaylist(request) {
  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(15000) });
    if (response.ok) {
      const cache = await caches.open(PLAYLIST_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}
