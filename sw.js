/* Service Worker — App del Taller (curly-doodle)
   v3 · network-first para la app (nunca te deja con la versión vieja)
   + notificaciones push + click que abre la unidad. */
const CACHE = "tk-taller-v3";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.allSettled(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Navegaciones: primero la RED (app siempre fresca); si no hay internet, la caché */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const clon = resp.clone();
            caches.open(CACHE).then((c) => c.put("./", clon));
          }
          return resp;
        })
        .catch(async () => {
          const hit = await caches.match("./", { ignoreSearch: true });
          if (hit) return hit;
          const keys = await caches.keys();
          for (const k of keys) {
            const r = await caches.match(k);
            if (r && (r.headers.get("content-type") || "").includes("text/html")) return r;
          }
          throw new Error("sin red y sin caché");
        })
    );
    return;
  }

  /* Estáticos: caché primero, luego red (y se actualiza la caché) */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const red = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const clon = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, clon));
          }
          return resp;
        })
        .catch(() => hit);
      return hit || red;
    })
  );
});

/* Push del servidor (Web Push): llega aunque la app no esté abierta */
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data ? e.data.text() : "" }; }
  const opts = {
    body: data.body || "",
    icon: data.icon || "./icon-192.png",
    badge: data.badge || "./icon-192.png",
    tag: data.tag || "tk",
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || "./", unidadId: data.unidadId || null }
  };
  e.waitUntil(self.registration.showNotification(data.title || "Thermo King", opts));
});

/* Click en la notificación: abre (o enfoca) la app, en la unidad si viene el id */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const d = e.notification.data || {};
  let url = d.url || "./";
  if (d.unidadId) {
    const base = url.split("#")[0];
    url = base + "#unidad=" + d.unidadId;
  }
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          if (d.unidadId && "navigate" in c) { try { c.navigate(url); } catch (err) {} }
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "skip-waiting") self.skipWaiting();
});
