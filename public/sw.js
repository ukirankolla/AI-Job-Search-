const VERSION = "noventra-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        cache.addAll([
          "/manifest.webmanifest",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
          "/icons/icon-512-maskable.png",
          "/icons/apple-touch-icon.png",
        ]),
      )
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";

  if (isStatic) {
    // Cache-first for hashed/static assets.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Network-first for pages/API; fall back to cache only when offline.
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || Response.error()),
    ),
  );
});
