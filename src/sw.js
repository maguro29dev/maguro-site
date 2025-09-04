// src/sw.js

// ▼▼▼ APIキャッシュ分離前のコードに戻し、段階的に進めます ▼▼▼
const CACHE_NAME = 'maguro-site-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // '/css/style.css', // ← この行を削除しました
  '/js/main.js',
  '/images/apple-touch-icon.png',
  // base.njk内のfaviconのパスが間違っていたので修正
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
        // skipWaiting() を呼び出して、即座にアクティベートさせる
        self.skipWaiting(); 
        return cache.addAll(urlsToCache);
      })
  );
});

// fetchイベントリスナー（Stale-While-Revalidate戦略）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchedResponse;
      });
    })
  );
});

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

// プッシュ通知を受け取った時の処理
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'まぐにぃからのお知らせ';
  const options = {
    body: data.body,
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-96x96.png'
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});