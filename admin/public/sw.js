self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through fetch to satisfy Chrome PWA install requirements
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline mode not supported.'))
  );
});
