// src/sw.js

const CACHE_NAME = 'maguro-site-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/images/apple-touch-icon.png',
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png',
  '/manifest.json'
];

// Service Workerのインストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// ▼▼▼【ここから変更】キャッシュ戦略を「Stale-While-Revalidate」に変更 ▼▼▼
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // ネットワークから取得したレスポンスをキャッシュに保存
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // キャッシュがあればそれを返し、なければネットワークからの応答を待つ
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
// ▲▲▲【変更ここまで】▲▲▲

// 古いキャッシュの削除処理
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