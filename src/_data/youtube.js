// src/_data/youtube.js

const EleventyFetch = require("@11ty/eleventy-fetch");
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const YOUTUBE_PLANNING_PLAYLIST_ID = process.env.YOUTUBE_PLANNING_PLAYLIST_ID;

// チャンネルの動画情報を取得する共通関数
async function fetchChannelVideos(eventType) {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    console.error("API Key or Channel ID is missing. Aborting API call to search endpoint.");
    return { items: [] };
  }
  // 修正点: type=video パラメータを追加
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=5&eventType=${eventType}&type=video`;
  
  return EleventyFetch(url, {
    duration: "1m", // ライブ情報は頻繁に更新したいので1分キャッシュ
    type: "json"
  });
}

// 再生リストの動画情報を取得する関数
async function fetchPlaylistVideos(playlistId) {
  if (!playlistId || !YOUTUBE_API_KEY) {
    console.warn("API Key or Playlist ID is not set. Skipping playlist fetch.");
    return { items: [] };
  }
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&part=snippet&playlistId=${playlistId}&maxResults=12`;
  
  return EleventyFetch(url, {
    duration: "1d", // 再生リストは頻繁に更新されないので1日間キャッシュし、APIを節約
    type: "json"
  });
}

module.exports = async function() {
  console.log("Fetching YouTube data...");

  try {
    // ライブ配信と配信予定を取得
    const livePromise = fetchChannelVideos("live");
    const upcomingPromise = fetchChannelVideos("upcoming");
    
    // 企画会議の再生リストを取得
    const planningPlaylistPromise = fetchPlaylistVideos(YOUTUBE_PLANNING_PLAYLIST_ID);

    // 全てのAPIリクエストを並行して実行
    const [liveData, upcomingData, planningPlaylistData] = await Promise.all([
      livePromise,
      upcomingPromise,
      planningPlaylistPromise
    ]);

    console.log("Data fetched successfully!");

    // ★★★ ここから修正箇所 ★★★
    // index.njkが期待する古いデータ形式も用意してあげることで、後方互換性を保ちます。
    const liveVideo = liveData.items && liveData.items.length > 0 ? liveData.items[0] : null;
    
    // Search APIの結果にはliveStreamingDetailsが含まれないため、upcomingVideosはupcoming.itemsを直接使うようにします。
    // index.njk側で .id ではなく .id.videoId でアクセスする必要がある点に注意が必要ですが、
    // 以前の複雑な取得方法に戻すより、こちらの方がシンプルでAPI消費も少ないため、この形を採用します。
    // ただし、これだとカウントダウンが動かないため、以前の取得ロジックを復活させます。

    // --- 配信予定の動画リストを取得（以前のAPI使用量削減ロジックを復活） ---
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
    const channelData = await EleventyFetch(channelUrl, { duration: "1d", type: "json" });
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const playlistData = await EleventyFetch(playlistUrl, { duration: "1h", type: "json" });
    const videoIds = (playlistData.items || []).map(item => item.snippet.resourceId.videoId).filter(id => id);

    let upcomingVideos_detailed = [];
    if (videoIds.length > 0) {
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const videosData = await EleventyFetch(videosUrl, { duration: "1h", type: "json" });

        upcomingVideos_detailed = (videosData.items || [])
            .filter(item =>
                item.snippet.liveBroadcastContent === 'upcoming' &&
                item.liveStreamingDetails?.scheduledStartTime
            )
            .sort((a, b) => new Date(a.liveStreamingDetails.scheduledStartTime) - new Date(b.liveStreamingDetails.scheduledStartTime));
    }

    return {
      // 新しいデータ形式
      live: liveData,
      upcoming: upcomingData,
      planningPlaylist: planningPlaylistData,

      // index.njkのための古いデータ形式（後方互換性）
      liveVideo: liveVideo,
      upcomingVideos: upcomingVideos_detailed
    };
    // ★★★ ここまで修正箇所 ★★★

  } catch (error) {
    console.error("Error fetching YouTube data:", error.message);
    // エラーが発生した場合もサイトのビルドが止まらないように、空のデータを返す
    return {
      live: { items: [] },
      upcoming: { items: [] },
      planningPlaylist: { items: [] },
      // エラー時も古い形式の空データを返す
      liveVideo: null,
      upcomingVideos: []
    };
  }
};