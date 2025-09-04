// src/js/main.js

// VAPIDキーの公開鍵（以前に生成したもの）
const VAPID_PUBLIC_KEY = 'ここに先ほど生成した公開鍵（Public Key）を貼り付け';

/**
 * URL-safe Base64をUint8Arrayに変換する
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Service Workerの登録とプッシュ通知の購読
 */
async function setupPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // Service Workerを登録
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful:', registration);

      // ▼▼▼【ここから変更】Service Workerが有効になるのを待つ ▼▼▼
      // registration の代わりに、準備が整った registration を使う
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('ServiceWorker is active and ready.');
      
      // 通知の許可を求める
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission not granted.');
        return;
      }

      // プッシュ通知の購読
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('Push subscription successful:', subscription);
      // ▲▲▲【変更ここまで】▲▲▲

      // ★★★ この後のステップで、購読情報をサーバーに送信する処理を追加します ★★★

    } catch (error) {
      console.error('ServiceWorker registration or Push subscription failed: ', error);
    }
  }
}

window.addEventListener('load', () => {
  setupPushNotifications();
});