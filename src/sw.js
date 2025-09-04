// src/sw.js

const CACHE_NAME = 'maguro-site-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/main.js',
  '/images/apple-touch-icon.png',
  '/images/icon-32x32.png', 
  '/images/icon-16x16.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        self.skipWaiting(); 
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ▼▼▼【ここから変更】不要なリクエストをキャッシュしないように修正 ▼▼▼
self.addEventListener('fetch', (event) => {
  // GETリクエスト以外はキャッシュしない
  if (event.request.method !== 'GET') {
    return;
  }
  // 拡張機能など、http/https以外のリクエストは無視
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Stale-While-Revalidate戦略
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // 正常なレスポンスのみキャッシュする
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
// ▲▲▲【変更ここまで】▲▲▲

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'まぐろからのお知らせ';
  const options = {
    body: data.body,
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-96x96.png'
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});