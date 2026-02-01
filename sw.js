// Minimal service worker: caches the app shell for offline viewing.
// Update CACHE_NAME when you ship a new version.

const CACHE_NAME = "qr-menu-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./background.css",
  "./menu.js",
  "./menu.json",
  "./phase3.js",
  "./images/astronaut.webp",
  "./qr.html",
  "./qr.js"
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
