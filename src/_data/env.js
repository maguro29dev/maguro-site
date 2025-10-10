// src/_data/env.js
// .envファイルから環境変数を読み込むためにdotenvをインポート
require('dotenv').config();

module.exports = {
  // クライアントサイドのJavaScriptで利用するFirebaseの設定
  // Netlifyの環境変数や.envファイルから読み込む
  firebaseConfig: {
    apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.PUBLIC_FIREBASE_APP_ID,
  }
};
