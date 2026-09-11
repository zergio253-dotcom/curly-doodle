/* Thermo King Chihuahua / Juárez - Service Worker (segundo plano + notificaciones) */
const CACHE_NAME = 'tk-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification.data) || {};
  const targetUrl = data.url || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'notif-click',
            url: targetUrl,
            mensajeId: data.mensajeId || null,
            unidadId: data.unidadId || null,
            openChat: !!data.openChat
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'show-notification' && data.title) {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '',
        icon: data.icon || './icon-192.png',
        badge: data.badge || undefined,
        tag: data.tag || 'tk-chihuahua',
        renotify: true,
        requireInteraction: !!data.requireInteraction,
        data: data.data || { url: './index.html' }
      })
    );
  }
  if (data.type === 'ping') {
    // mantener SW activo; sin acción
  }
});

// Push remoto (si en el futuro se configura VAPID/FCM)
self.addEventListener('push', (event) => {
  let payload = { title: 'Thermo King', body: 'Nueva actividad' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    try { payload.body = event.data.text(); } catch (e2) {}
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Thermo King', {
      body: payload.body || '',
      icon: payload.icon || './icon-192.png',
      tag: payload.tag || 'tk-push',
      renotify: true,
      data: payload.data || { url: './index.html' }
    })
  );
});
