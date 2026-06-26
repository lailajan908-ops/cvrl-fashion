const CACHE = "cvrl-v1"
const ASSETS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/cvrl-icon.svg"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => { if (k !== CACHE) return caches.delete(k) }))).then(() => clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Cache static assets
  if (ASSETS.includes(url.pathname)) {
    e.respondWith(caches.match(request))
    return
  }

  // Network first, fallback to cache for navigations
  e.respondWith(
    fetch(request).then((res) => {
      if (res.ok && url.origin === self.location.origin) {
        const clone = res.clone()
        caches.open(CACHE).then((c) => c.put(request, clone))
      }
      return res
    }).catch(() => {
      if (request.mode === "navigate") return caches.match("/")
      return caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 }))
    })
  )
})
