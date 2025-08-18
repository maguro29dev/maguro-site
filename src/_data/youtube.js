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
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=5&eventType=${eventType}&type=video`;
  return EleventyFetch(url, { duration: "1m", type: "json" });
}

// 再生リストの動画をランキング形式で取得する関数
async function fetchRankedPlaylistVideos(playlistId) {
  if (!playlistId || !YOUTUBE_API_KEY) {
    console.warn("API Key or Playlist ID is not set. Skipping playlist fetch.");
    return [];
  }

  // 1. 再生リストから最大50件の動画IDを取得
  const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&part=snippet&playlistId=${playlistId}&maxResults=50`;
  const playlistData = await EleventyFetch(playlistItemsUrl, { duration: "1d", type: "json" });

  if (!playlistData.items || playlistData.items.length === 0) {
    return [];
  }
  const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId);

  // 2. 取得した動画IDを元に、再生回数や高評価などの詳細情報を取得
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&part=snippet,statistics&id=${videoIds.join(',')}`;
  const videosData = await EleventyFetch(videosUrl, { duration: "1d", type: "json" });

  // 3. スコアを計算し、人気順に並び替えて上位5件を返す
  const rankedVideos = videosData.items
    .map(video => {
      const viewCount = parseInt(video.statistics.viewCount, 10) || 0;
      const likeCount = parseInt(video.statistics.likeCount, 10) || 0;
      // スコア計算式: 再生回数 + (高評価数 * 10) ※高評価を10倍重視
      const score = viewCount + (likeCount * 10);
      return { ...video, score: score };
    })
    .sort((a, b) => b.score - a.score) // スコアの高い順にソート
    .slice(0, 5); // 上位5件を取得

  return rankedVideos;
}

// ▼▼▼【追加】再生リストの最終更新日時を取得する関数 ▼▼▼
async function getPlaylistLastUpdate(playlistId) {
    if (!playlistId || !YOUTUBE_API_KEY) {
        return null;
    }
    try {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${YOUTUBE_API_KEY}`;
        const data = await EleventyFetch(url, { duration: "1h", type: "json" });
        // 最新の動画が追加された日時を返す
        if (data.items && data.items.length > 0) {
            return data.items[0].snippet.publishedAt;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching playlist ${playlistId}:`, error.message);
        return null;
    }
}

module.exports = async function() {
  console.log("Fetching YouTube data...");
  try {
    const livePromise = fetchChannelVideos("live");
    const upcomingPromise = fetchChannelVideos("upcoming");
    const rankedPlaylistPromise = fetchRankedPlaylistVideos(YOUTUBE_PLANNING_PLAYLIST_ID);

    const [liveData, upcomingData, rankedPlaylistData] = await Promise.all([
      livePromise,
      upcomingPromise,
      rankedPlaylistPromise
    ]);

    // ▼▼▼【ここから変更】ライブ中の動画がプレミア公開か判別するロジックを追加 ▼▼▼
    let liveVideo = null;
    if (liveData.items && liveData.items.length > 0) {
        const videoId = liveData.items[0].id.videoId;
        // videos APIを叩いて詳細情報を取得
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&part=contentDetails,liveStreamingDetails&id=${videoId}`;
        const videoDetailsData = await EleventyFetch(videoDetailsUrl, { duration: "1m", type: "json" });
        
        let isPremiere = false;
        if (videoDetailsData.items && videoDetailsData.items.length > 0) {
            const duration = videoDetailsData.items[0].contentDetails.duration;
            // durationがPT0Sでなければプレミア公開と判断
            if (duration !== 'PT0S') {
                isPremiere = true;
            }
        }
        
        liveVideo = { 
            ...liveData.items[0],
            isPremiere: isPremiere // 判別結果をオブジェクトに追加
        };
    }
    // ▲▲▲【ここまで変更】▲▲▲

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
            .filter(item => item.snippet.liveBroadcastContent === 'upcoming' && item.liveStreamingDetails?.scheduledStartTime)
            .sort((a, b) => new Date(a.liveStreamingDetails.scheduledStartTime) - new Date(b.liveStreamingDetails.scheduledStartTime));
    }

    console.log("Data fetched successfully!");
    return {
      live: liveData,
      upcoming: upcomingData,
      planningPlaylist: rankedPlaylistData,
      liveVideo: liveVideo,
      upcomingVideos: upcomingVideos_detailed,
      getPlaylistLastUpdate: getPlaylistLastUpdate
    };
  } catch (error) {
    console.error("Error fetching YouTube data:", error.message);
    return {
      live: { items: [] },
      upcoming: { items: [] },
      planningPlaylist: [],
      liveVideo: null,
      upcomingVideos: [],
      getPlaylistLastUpdate: async () => null
    };
  }
};