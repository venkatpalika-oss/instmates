const CACHE_NAME = "instmates-v1";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/assets/css/style.css",
  "/assets/js/includes.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
