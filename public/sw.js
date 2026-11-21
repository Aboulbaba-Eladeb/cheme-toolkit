// Offline support: cache the app shell on install, then serve cache-first and refresh in the background.
const CACHE = "cheme-toolkit-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./icon.svg", "./manifest.webmanifest"]))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    const net = fetch(req).then(res => { if (res.ok && (res.type === "basic" || res.type === "cors")) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
