const webpush = require('web-push');
const admin = require('firebase-admin');

// 既存の環境変数 FIREBASE_ADMIN_CONFIG を使用
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);

// 最初に一度だけFirebase Admin SDKを初期化する
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// VAPIDキーを設定（VAPID_SUBJECT を正しく反映）
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  // POSTリクエスト以外は拒否
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 【変更点②】ここから管理者認証の関所
    // 1. ヘッダーから認証トークンを取得
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return { statusCode: 401, body: 'Unauthorized: No token provided' };
    }

    // 2. トークンを検証し、ユーザー情報を取得
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 3. 管理者（admin）権限があるかチェック
    if (decodedToken.admin !== true) {
      return { statusCode: 403, body: 'Forbidden: User is not an admin' };
    }
    // 【変更点②】ここまで管理者認証の関所

    // --- 認証成功 ---
    console.log(`Request from admin user: ${decodedToken.uid}`);

    // Firestoreから全ての購読情報を取得
    const subscriptionsSnapshot = await db.collection('subscriptions').get();
    if (subscriptionsSnapshot.empty) {
      console.log('No subscriptions found.');
      return { statusCode: 200, body: 'No subscriptions to send notifications to.' };
    }
    
    const subscriptions = [];
    subscriptionsSnapshot.forEach(doc => {
      subscriptions.push(doc.data());
    });

    // 通知のペイロードをリクエストボディから取得
    const { title, body, url } = JSON.parse(event.body);
    const payload = JSON.stringify({ title, body, url });

    // 全ての購読者に通知を送信
    const sendPromises = subscriptions.map(sub => 
      // 【変更点③】エラー処理を強化
      webpush.sendNotification(sub, payload).catch(err => {
        // 送信に失敗した場合（例: 購読が無効になっている）、エラーをログに出力
        console.error(`Failed to send notification to ${sub.endpoint.substring(0, 20)}...`, err.statusCode);
      })
    );

    await Promise.all(sendPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Notifications sent to ${subscriptions.length} subscribers.` }),
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    // 認証エラーの場合
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return { statusCode: 401, body: `Unauthorized: ${error.message}` };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send notifications.', details: error.message }),
    };
  }
};

