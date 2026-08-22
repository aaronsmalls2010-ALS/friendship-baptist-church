const CACHE_NAME = "fbc-v3";

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

  // Never touch auth / admin / portal / API routes. Do NOT call respondWith here
  // — let the browser handle these requests natively. Intercepting App Router
  // navigation (RSC) requests and re-issuing them via fetch() breaks client-side
  // navigation and forces a full page reload on every click.
  if (NO_CACHE_PATTERNS.some((p) => p.test(path))) {
    return;
  }

  // Also let ALL App Router navigation/RSC requests pass through untouched
  // (identified by the RSC header or the _rsc query param), so client-side
  // navigation is never intercepted.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
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

// -- Web Push ---------------------------------------------------------------
// Payloads are sent by /src/lib/push/send.ts as JSON:
//   { title, body, url, tag }

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Some push services deliver a bare string; fall back to it as the body.
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Friendship Baptist Church";
  const options = {
    body: data.body || "",
    icon: "/images/logos/fbc-icon.png",
    badge: "/images/logos/fbc-icon.png",
    // The same tag replaces an earlier notification instead of stacking a duplicate.
    tag: data.tag || "fbc-notification",
    renotify: Boolean(data.tag),
    data: { url: data.url || "/portal" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an already-open tab when there is one,
// otherwise opens a new window at the deep link.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/portal";
  const targetUrl = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) return client.focus();
        }
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(targetUrl).then((c) => (c ? c.focus() : null));
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Browsers rotate push subscriptions periodically. Re-subscribe with the same
// VAPID key and hand the new endpoint to the server, otherwise the member goes
// silently dark. Fails quietly when nobody is signed in on this device.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    fetch("/api/portal/push")
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (!info || !info.publicKey) return null;
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(info.publicKey),
        });
      })
      .then((sub) => {
        if (!sub) return null;
        return fetch("/api/portal/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      })
      .catch(() => {
        // Nothing more we can do from the worker; the portal toggle re-registers
        // the next time the member opens the site.
      })
  );
});

/** VAPID keys travel as base64url; the subscribe() API wants raw bytes. */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = self.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}
