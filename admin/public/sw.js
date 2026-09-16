self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Pass through everything, minimal SW for PWA installability
  e.respondWith(fetch(e.request).catch(() => new Response("Offline mode not available.")));
});
