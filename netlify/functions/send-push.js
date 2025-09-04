// netlify/functions/send-push.js

const admin = require('firebase-admin');
const webpush = require('web-push');

// 環境変数からFirebaseの認証情報を読み込む
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);

// Firebase Admin SDKを初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// VAPIDキーを設定
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const db = admin.firestore();

exports.handler = async (event) => {
  // POSTリクエスト以外は弾く
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { title, body, secret } = JSON.parse(event.body);

    // ★★★ 管理者用の秘密のパスワードをチェック ★★★
    if (secret !== process.env.ADMIN_SECRET_KEY) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    // Firestoreから全ての購読情報を取得
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    const subscriptions = [];
    subscriptionsSnapshot.forEach(doc => {
      subscriptions.push(doc.data());
    });

    console.log(`Sending notification to ${subscriptions.length} subscribers.`);

    // 全ての購読者に通知を送信
    const notificationPromises = subscriptions.map(subscription => {
      const payload = JSON.stringify({ title, body });
      return webpush.sendNotification(subscription, payload)
        .catch(error => {
          // 送信に失敗した購読情報はログに記録（後でDBから削除するなどの対応も可能）
          console.error(`Failed to send notification to ${subscription.endpoint.substring(0, 20)}...`, error.statusCode);
        });
    });

    await Promise.all(notificationPromises);

    console.log('All notifications sent successfully.');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${subscriptions.length}人の購読者に通知を送信しました。` }),
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send notifications.' }),
    };
  }
};