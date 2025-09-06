const CACHE_NAME = 'maguro29-site-cache-v2'; // キャッシュ名を更新
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// 1. インストール処理
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. キャッシュの有効化と古いキャッシュの削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. リクエストへの応答（キャッシュ優先）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにヒットすれば、それを返す
        if (response) {
          return response;
        }
        // ヒットしなければ、ネットワークから取得
        return fetch(event.request);
      })
  );
});

// --- ▼▼▼ ここからが今回の核心部分 ▼▼▼ ---

// 4. プッシュ通知を受け取った時の処理
self.addEventListener('push', event => {
  let notificationData = {
    title: '新しいお知らせ',
    body: 'サイトをチェックしてください。',
    icon: '/images/icon-192x192.png',
    data: {
      url: self.location.origin, // デフォルトのURLはサイトのトップページ
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title;
      notificationData.body = data.body;
      if (data.url) {
        notificationData.data.url = data.url;
      }
    } catch (e) {
      console.error('[Service Worker] Push event data parse error:', e);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: '/images/icon-96x96.png', // Androidで表示される小さなアイコン
    data: notificationData.data
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 5. 通知がクリックされた時の処理
self.addEventListener('notificationclick', event => {
  event.notification.close(); // 通知を閉じる

  const urlToOpen = event.notification.data.url || self.location.origin;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // すでにサイトが開かれているかチェック
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 開かれていなければ、新しいウィンドウで開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
