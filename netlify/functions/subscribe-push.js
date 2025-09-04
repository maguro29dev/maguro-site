// netlify/functions/subscribe-push.js

const admin = require('firebase-admin');
const webpush = require('web-push');

// 環境変数からFirebaseの認証情報を読み込む
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);

// Firebase Admin SDKを初期化
// 同じ関数内で複数回初期化されないようにチェック
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
    const subscription = JSON.parse(event.body);

    // Firestoreの'subscriptions'コレクションに購読情報を保存
    await db.collection('subscriptions').add(subscription);
    console.log('Subscription saved to Firestore.');

    // 登録完了のテスト通知を送信
    const payload = JSON.stringify({
      title: '購読ありがとうございます！',
      body: 'プッシュ通知が有効になりました。お知らせをお楽しみに！',
    });
    await webpush.sendNotification(subscription, payload);
    console.log('Test notification sent.');

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Subscription saved successfully.' }),
    };
  } catch (error) {
    console.error('Error:', error);
    // エラーレスポンスを返す
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process subscription.' }),
    };
  }
};