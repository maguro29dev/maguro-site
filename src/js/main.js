// src/js/main.js

// VAPIDキーの公開鍵
const VAPID_PUBLIC_KEY = 'BE6Sq3yc-0Viy_acHHlc0QQ_z2Wb3nav_owd1cHNdyircgu82IKSa9VCmblcFvvIkwK-rDWd452mFlpePlJKJuc';

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
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful:', registration);
      
      const readyRegistration = await navigator.serviceWorker.ready;
      console.log('ServiceWorker is active and ready.');
      
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission not granted.');
        return;
      }

      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('Push subscription successful:', subscription);
      
      // ▼▼▼【ここから変更】購読情報をサーバーに送信する処理 ▼▼▼
      await fetch('/.netlify/functions/subscribe-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
      console.log('Subscription data sent to server.');
      // ▲▲▲【変更ここまで】▲▲▲

    } catch (error) {
      console.error('ServiceWorker registration or Push subscription failed: ', error);
    }
  }
}

window.addEventListener('load', () => {
  setupPushNotifications();
});
// ... 既存のコード ...

// Service Workerの登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
      })
      .catch(registrationError => {
        console.log('Service Worker registration failed: ', registrationError);
      });
  });
}
