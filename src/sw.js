// src/sw.js

const STATIC_CACHE_NAME = 'maguro-site-static-cache-v1';
const DYNAMIC_CACHE_NAME = 'maguro-site-dynamic-cache-v1';
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
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Opened static cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 古いキャッシュの削除処理
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
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

// ▼▼▼【ここから変更】APIと静的アセットでキャッシュ戦略を分離 ▼▼▼
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // APIリクエストの判定 (ContentfulとYouTube API)
  if (url.hostname.includes('contentful.com') || url.hostname.includes('googleapis.com')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return fetch(event.request).then((networkResponse) => {
          // ネットワークから取得したレスポンスを動的キャッシュに保存
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          // オフライン時はキャッシュから返す
          return cache.match(event.request);
        });
      })
    );
  } else {
    // 静的アセットの処理 (Stale-While-Revalidate)
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchedResponse = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchedResponse;
        });
      })
    );
  }
});
// ▲▲▲【変更ここまで】▲▲▲