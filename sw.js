const CACHE_NAME = 'russian-app-v1';

// Tous les fichiers à mettre en cache pour le mode offline
const ASSETS_TO_CACHE = [
  '/Mon-site/',
  '/Mon-site/index.html',
  '/Mon-site/manifest.json',
  // Polices Google Fonts (seront cachées dynamiquement à la première visite)
];

// Installation : mise en cache des ressources principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch : stratégie Cache First (offline d'abord, réseau si besoin)
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Si en cache → retourner immédiatement (fonctionne offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Sinon → fetch depuis le réseau ET mettre en cache
      return fetch(event.request).then(networkResponse => {
        // Ne cacher que les réponses valides
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type !== 'opaque'
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // En cas d'échec réseau total → retourner la page principale en fallback
        if (event.request.destination === 'document') {
          return caches.match('/Mon-site/index.html');
        }
      });
    })
  );
});
