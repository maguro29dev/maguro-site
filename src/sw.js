// ▼▼▼ 変更点①：キャッシュのバージョンを更新 ▼▼▼
const CACHE_NAME = 'maguro29-site-cache-v3'; 
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
  // ここにはサイトの骨格となる最小限のファイルのみを記載
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
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ▼▼▼ 変更点②：キャッシュ戦略を「Stale-While-Revalidate」に変更 ▼▼▼
self.addEventListener('fetch', event => {
  // HTMLページ（ナビゲーションリクエスト）の場合
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // まずネットワークに接続試行（Network First）
      fetch(event.request)
        .then(response => {
          // 接続できたら、キャッシュを更新しつつ、レスポンスを返す
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // オフラインの場合はキャッシュから返す
          return caches.match(event.request);
        })
    );
    return;
  }

  // HTML以外のリソース（CSS, JS, 画像など）の場合
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返し、裏側でネットワークから新しいものを取得してキャッシュを更新
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        return response || fetchPromise;
      })
  );
});


// 4. プッシュ通知を受け取った時の処理 (変更なし)
self.addEventListener('push', event => {
  let notificationData = {
    title: '新しいお知らせ',
    body: 'サイトをチェックしてください。',
    icon: '/images/icon-192x192.png',
    data: {
      url: self.location.origin,
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
    badge: '/images/icon-96x96.png',
    data: notificationData.data
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 5. 通知がクリックされた時の処理 (変更なし)
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || self.location.origin;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

