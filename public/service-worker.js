const CACHE_NAME = "instmates-v2";

const CORE_ASSETS = [
"/",
"/index.html",
"/manifest.json",
"/assets/css/style.css",
"/assets/js/includes.js",
"/assets/icons/icon-192.png",
"/assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
self.skipWaiting();
event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
return Promise.all(
CORE_ASSETS.map(url =>
cache.add(url).catch(err => console.warn("SW cache skip:", url, err))
)
);
})
);
});

self.addEventListener("activate", event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
)
).then(() => self.clients.claim())
);
});

self.addEventListener("fetch", event => {
if (event.request.method !== "GET") return;
event.respondWith(
caches.match(event.request).then(res => {
return (
res ||
fetch(event.request).catch(() => caches.match("/index.html"))
);
})
);
});
