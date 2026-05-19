const CACHE_VERSION = '0.1.0-preflight';
const CACHE_NAME = `audi-dealership-game-${CACHE_VERSION}`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/app-icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('audi-dealership-game-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const isAssetRequest = request => (
  request.destination === 'script'
  || request.destination === 'style'
  || request.destination === 'image'
  || request.url.includes('/assets/')
);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', clone));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (isAssetRequest(request)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
