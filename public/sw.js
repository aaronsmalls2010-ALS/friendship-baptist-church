const CACHE_NAME = "fbc-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = ["/"];

// Routes that should never be cached (auth, admin, portal, API)
const NO_CACHE_PATTERNS = [
  /^\/admin/,
  /^\/portal/,
  /^\/auth/,
  /^\/api\//,
];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// Fetch strategy:
//   - Admin/portal/auth/API: network-only (never cache)
//   - Navigation requests: network-first, fall back to cached home page
//   - Static assets (_next/static, images, fonts): cache-first
//   - Everything else: network-first
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Never cache auth / admin / portal / API routes
  if (NO_CACHE_PATTERNS.some((p) => p.test(path))) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for immutable static assets
  if (
    path.startsWith("/_next/static/") ||
    path.startsWith("/images/") ||
    path.match(/\.(woff2?|ttf|otf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first for navigation and everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.mode === "navigate") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: return cached version or cached home page
        return caches.match(request).then(
          (cached) => cached || caches.match("/")
        );
      })
  );
});
