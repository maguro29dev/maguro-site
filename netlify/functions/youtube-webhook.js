// netlify/functions/youtube-webhook.js

const crypto = require('crypto');
const fetch = require('node-fetch');

// 環境変数から設定を読み込み
const BUILD_HOOK_URL = process.env.BUILD_HOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

exports.handler = async function(event, context) {
  // --- GETリクエストの処理 (YouTubeからの購読確認) ---
  if (event.httpMethod === 'GET') {
    const query = event.queryStringParameters;
    const mode = query['hub.mode'];
    const challenge = query['hub.challenge'];
    const topic = query['hub.topic'];

    // 購読確認リクエストの場合、challengeをそのまま返す
    if (mode === 'subscribe' || mode === 'unsubscribe') {
      console.log(`YouTube Webhook: Responding to ${mode} challenge for topic: ${topic}`);
      return {
        statusCode: 200,
        body: challenge,
      };
    } else {
      console.error('YouTube Webhook: Received GET request without valid hub.mode.');
      return {
        statusCode: 400,
        body: 'Bad Request: Missing hub.mode',
      };
    }
  }

  // --- POSTリクエストの処理 (YouTubeからの更新通知) ---
  if (event.httpMethod === 'POST') {
    // 1. リクエストの署名を検証する
    const signature = event.headers['x-hub-signature'] || '';
    const [algo, sig] = signature.split('=');

    if (!sig) {
      console.error('YouTube Webhook: Signature missing!');
      return { statusCode: 401, body: 'Signature missing!' };
    }

    const hmac = crypto.createHmac(algo, WEBHOOK_SECRET);
    hmac.update(event.body);
    const digest = hmac.digest('hex');

    if (digest !== sig) {
      console.error('YouTube Webhook: Invalid signature.');
      return { statusCode: 401, body: 'Invalid signature.' };
    }

    console.log('YouTube Webhook: Signature verified successfully.');

    // 2. 署名が正しければ、ビルドフックを叩いてサイトを再構築
    try {
      console.log('YouTube Webhook: Triggering Netlify build...');
      await fetch(BUILD_HOOK_URL, { method: 'POST' });
      console.log('YouTube Webhook: Build triggered successfully.');
      
      // YouTubeには成功したことを伝える
      return {
        statusCode: 200,
        body: 'Build triggered.',
      };
    } catch (error) {
      console.error('YouTube Webhook: Error triggering build hook:', error);
      return {
        statusCode: 500,
        body: 'Failed to trigger build.',
      };
    }
  }

  // GET/POST以外のメソッドは許可しない
  return {
    statusCode: 405,
    body: 'Method Not Allowed',
  };
};