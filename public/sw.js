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
