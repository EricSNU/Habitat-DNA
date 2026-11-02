const CACHE_NAME = 'mosquito-dna-pwa-v1-12';

self.addEventListener('install', event => {
  event.waitUntil(
    self.skipWaiting()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    url.pathname === '/api' ||
    url.pathname === '/sw.js'
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (
            response &&
            response.ok
          ) {
            const copy =
              response.clone();

            caches.open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  '/index.html',
                  copy
                )
              );
          }

          return response;
        })
        .catch(() =>
          caches.match('/index.html')
        )
    );

    return;
  }

  if (
    request.method === 'GET' &&
    url.origin === self.location.origin
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (
            response &&
            response.ok
          ) {
            const copy =
              response.clone();

            caches.open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  request,
                  copy
                )
              );
          }

          return response;
        })
        .catch(() =>
          caches.match(request)
        )
    );
  }
});
