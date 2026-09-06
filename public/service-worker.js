/* =========================================================
   InstMates – Service Worker (post-W0 cleanup: instmates-v4)

   "instmates-v4" (branding cleanup): same strategy as v3; the precache
   now lists the new icon/mark filenames and activation deletes the v3
   cache so returning visitors drop the old cached branding.

   Previous behaviour ("instmates-v2"): cache-first for EVERY GET,
   including HTML, JavaScript and cross-origin Firebase SDK files, with
   /index.html served for any failed request. Returning visitors kept
   running whatever JavaScript they first cached, so security fixes
   could not reach them until the cache name changed.

   New behaviour ("instmates-v3"):
   - HTML documents and same-origin JS/CSS: network first, cache only
     as an offline fallback.
   - Same-origin images/icons/fonts: cache first (safe to be stale).
   - Cross-origin requests (Firebase, gstatic, fonts, analytics):
     never intercepted.
   - Offline fallback to /index.html only for navigation requests.
   - Activation deletes every older cache and takes control immediately.
========================================================= */

const CACHE_NAME = "instmates-v4";

const PRECACHE = [
  "/",
  "/manifest.json",
  "/assets/css/style.css",
  "/assets/icons/instmates-192.png",
  "/assets/icons/instmates-512.png",
  "/assets/brand/instmates-mark-128.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => console.warn("SW precache skip:", url, err))
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname);
}

async function networkFirst(request, { fallbackToIndex = false } = {}) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackToIndex) {
      const index = await cache.match("/");
      if (index) return index;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isSameOrigin(url)) return; // let the browser handle Firebase, fonts, analytics

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, { fallbackToIndex: true }));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // JS, CSS, JSON, includes: always try the network first.
  event.respondWith(networkFirst(request));
});
