// netlify/functions/get-video-status.js
const axios = require('axios');

// Netlifyのサーバーレス関数としてエクスポート
exports.handler = async function(event, context) {
  // クエリパラメータから videoId を取得
  const { videoId } = event.queryStringParameters;
  // 環境変数からYouTube APIキーを取得
  const API_KEY = process.env.YOUTUBE_API_KEY;

  // videoIdがない場合はエラーを返す
  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'videoId is required' })
    };
  }

  // YouTube Data API v3 の videos エンドポイントのURLを構築
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${API_KEY}`;

  try {
    // axiosを使ってAPIにリクエストを送信
    const response = await axios.get(url);
    const item = response.data.items[0];

    let status = 'none';
    let title = '';

    // レスポンスにアイテムがあれば、ステータスとタイトルを取得
    if (item && item.snippet) {
      status = item.snippet.liveBroadcastContent; // 'live', 'upcoming', 'none' のいずれか
      title = item.snippet.title;
    }
    
    // 'live' の場合でも、実際に配信が始まっているかを確認
    // プレミア公開も 'live' として扱われるため、この判定は重要
    if (status === 'live' && item.liveStreamingDetails && item.liveStreamingDetails.actualStartTime && !item.liveStreamingDetails.actualEndTime) {
        status = 'live'; // 実際に配信中
    }

    // 成功レスポンスを返す
    return {
      statusCode: 200,
      body: JSON.stringify({ status: status, title: title })
    };
  } catch (error) {
    // エラーハンドリング
    console.error('Error in get-video-status function:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch video status' })
    };
  }
};