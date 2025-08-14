// subscribe.js

const fetch = require('node-fetch');
require('dotenv').config(); // .envファイルから環境変数を読み込む

// --- 設定項目 ---
// 環境変数から読み込むか、直接書き換えてください
const NETLIFY_FUNCTION_URL = `${process.env.SITE_URL}/.netlify/functions/youtube-webhook`;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
// --- 設定ここまで ---

const HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const TOPIC_URL = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

async function subscribe() {
  console.log('Subscribing to YouTube channel updates...');
  console.log(`  - Channel ID: ${YOUTUBE_CHANNEL_ID}`);
  console.log(`  - Callback URL: ${NETLIFY_FUNCTION_URL}`);

  const params = new URLSearchParams();
  params.append('hub.mode', 'subscribe');
  params.append('hub.topic', TOPIC_URL);
  params.append('hub.callback', NETLIFY_FUNCTION_URL);
  params.append('hub.secret', WEBHOOK_SECRET);

  try {
    const response = await fetch(HUB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (response.status === 204) {
      console.log('✅ Subscription request sent successfully!');
      console.log('Please check your Netlify Function logs for a confirmation message from YouTube.');
    } else {
      console.error('❌ Subscription failed.');
      console.error(`  - Status: ${response.status}`);
      const text = await response.text();
      console.error(`  - Response: ${text}`);
    }
  } catch (error) {
    console.error('❌ An error occurred:', error);
  }
}

subscribe();