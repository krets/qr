const CACHE_NAME = 'qr-generator-v1';
const ASSETS = [
  '/',
  '/index.php',
  '/style.css',
  '/app.js',
  '/favicon.ico',
  '/og-image.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Intercept Web Share Target POST request
  if (event.request.method === 'POST' && url.pathname === '/' && url.searchParams.has('shared')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('contact');
          if (file) {
            const text = await file.text();
            
            // Store text temporarily inside Cache Storage
            const cache = await caches.open('shared-vcard-cache');
            await cache.put(
              new Request('/shared-vcard.vcf'),
              new Response(text, {
                headers: { 'Content-Type': 'text/vcard' }
              })
            );
          }
        } catch (err) {
          console.error('Error handling shared contact in Service Worker:', err);
        }
        
        // Redirect browser client to homepage with query param
        return Response.redirect('/?received-share=1', 303);
      })()
    );
    return;
  }

  // 2. Default fetch handler: Cache First with Network Fallback & update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors offline */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
