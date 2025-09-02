// src/sw.js

const CACHE_NAME = 'maguro-site-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css', // ← パスをプロジェクトの構成に合わせて修正しました
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

// リクエストへの応答処理 (キャッシュファースト戦略)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにヒットすれば、それを返す
        if (response) {
          return response;
        }
        // キャッシュになければ、ネットワークに取りに行く
        return fetch(event.request);
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