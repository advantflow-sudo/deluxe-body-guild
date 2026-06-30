/* Deluxe Fitness service worker — offline cache for shell + recent workouts */
const VERSION = "df-v1";
const SHELL = `df-shell-${VERSION}`;
const RUNTIME = `df-runtime-${VERSION}`;

const SHELL_URLS = [
  "/",
  "/manifest.json",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache Supabase auth / realtime / API calls.
  if (url.hostname.includes("supabase.co") || url.hostname.includes("supabase.in")) return;

  // Navigation: network-first, fall back to cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/", { ignoreSearch: true }) || caches.match(req)),
    );
    return;
  }

  // Static assets: stale-while-revalidate from runtime cache.
  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      }),
    );
  }
});

// Web Push: show notification from server payload, fall back to a default message.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || "Deluxe Fitness";
  const options = {
    body: data.body || "You have a new update.",
    icon: "/app-icon-192.png",
    badge: "/app-icon-192.png",
    data: { url: data.url || "/app/community" },
    tag: data.tag || "df-notif",
    renotify: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) { c.navigate(target); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});

// Allow the page to ask the SW to display a local notification when Push isn't wired.
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "df-show-notification" && msg.title) {
    self.registration.showNotification(msg.title, msg.options || {});
  }
});
