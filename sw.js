const CACHE_NAME = 'thermoking-v1';
const urlsToCache = [
  '/curly-doodle/',
  '/curly-doodle/index.html',
  // Añade aquí todos tus archivos .css y .js que sean estáticos
  // Ejemplo: '/curly-doodle/styles.css', '/curly-doodle/app.js'
];

// Instalación: guarda los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activación: limpia cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Intercepción de peticiones: sirve desde caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});