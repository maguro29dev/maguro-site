// src/_data/youtube.js

const EleventyFetch = require("@11ty/eleventy-fetch");
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const YOUTUBE_PLANNING_PLAYLIST_ID = process.env.YOUTUBE_PLANNING_PLAYLIST_ID;

// チャンネルの動画情報を取得する共通関数
async function fetchChannelVideos(eventType) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=5&eventType=${eventType}`;
  return EleventyFetch(url, {
    duration: "1m", // ライブ情報は頻繁に更新したいので1分キャッシュ
    type: "json"
  });
}

// 再生リストの動画情報を取得する関数
async function fetchPlaylistVideos(playlistId) {
  if (!playlistId) {
    console.warn("YouTube Playlist ID is not set. Skipping playlist fetch.");
    return { items: [] }; // IDがなければ空の配列を返す
  }
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&part=snippet&playlistId=${playlistId}&maxResults=12`; // 最大12件取得
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

    return {
      live: liveData,
      upcoming: upcomingData,
      planningPlaylist: planningPlaylistData
    };

  } catch (error) {
    console.error("Error fetching YouTube data:", error.message);
    // エラーが発生した場合もサイトのビルドが止まらないように、空のデータを返す
    return {
      live: { items: [] },
      upcoming: { items: [] },
      planningPlaylist: { items: [] }
    };
  }
};