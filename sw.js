const CACHE_NAME = 'kiit-khoj-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // DO NOT cache Supabase API, Auth requests, or any cross-origin requests
  if (url.origin !== location.origin || url.pathname.includes('supabase') || url.hostname.includes('supabase')) {
    return; // Let the browser handle these normally without Service Worker interference
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Don't cache if not a valid success response
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
