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
  // プレミア公開を確実に捉えるため、maxResultsを少し増やしておく
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=10&eventType=${eventType}&type=video`;
  return EleventyFetch(url, { duration: "1m", type: "json" });
}

// 再生リストの動画をランキング形式で取得する関数
async function fetchRankedPlaylistVideos(playlistId) {
  if (!playlistId || !YOUTUBE_API_KEY) {
    console.warn("API Key or Playlist ID is not set. Skipping playlist fetch.");
    return [];
  }
  const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&part=snippet&playlistId=${playlistId}&maxResults=50`;
  const playlistData = await EleventyFetch(playlistItemsUrl, { duration: "1d", type: "json" });
  if (!playlistData.items || playlistData.items.length === 0) {
    return [];
  }
  const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId);
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&part=snippet,statistics&id=${videoIds.join(',')}`;
  const videosData = await EleventyFetch(videosUrl, { duration: "1d", type: "json" });
  return videosData.items
    .map(video => {
      const viewCount = parseInt(video.statistics.viewCount, 10) || 0;
      const likeCount = parseInt(video.statistics.likeCount, 10) || 0;
      const score = viewCount + (likeCount * 10);
      return { ...video, score: score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// 再生リストの最終更新日時を取得する関数
async function getPlaylistLastUpdate(playlistId) {
    if (!playlistId || !YOUTUBE_API_KEY) return null;
    try {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${YOUTUBE_API_KEY}`;
        const data = await EleventyFetch(url, { duration: "1h", type: "json" });
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
    // upcomingPromiseは今回直接は使わないが、並列取得は維持
    const upcomingPromise = fetchChannelVideos("upcoming");
    const rankedPlaylistPromise = fetchRankedPlaylistVideos(YOUTUBE_PLANNING_PLAYLIST_ID);

    const [liveData, upcomingData, rankedPlaylistData] = await Promise.all([
      livePromise,
      upcomingPromise,
      rankedPlaylistPromise
    ]);

    let liveVideo = null;
    if (liveData.items && liveData.items.length > 0) {
        const videoId = liveData.items[0].id.videoId;
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&part=snippet,liveStreamingDetails&id=${videoId}`;
        const videoDetailsData = await EleventyFetch(videoDetailsUrl, { duration: "1m", type: "json" });
        
        if (videoDetailsData.items && videoDetailsData.items.length > 0) {
            const details = videoDetailsData.items[0];
            const liveDetails = details.liveStreamingDetails;

            const isCurrentlyStreaming = liveDetails && liveDetails.actualStartTime && !liveDetails.actualEndTime;

            if (isCurrentlyStreaming) {
                let isPremiere = false;
                if (liveDetails.scheduledStartTime) {
                    const timeDifference = Math.abs(new Date(liveDetails.actualStartTime).getTime() - new Date(liveDetails.scheduledStartTime).getTime());
                    if (timeDifference < 60000) {
                        isPremiere = true;
                    }
                }
                
                liveVideo = { 
                    ...liveData.items[0],
                    snippet: details.snippet,
                    isPremiere: isPremiere
                };
            }
        }
    }

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
    const channelData = await EleventyFetch(channelUrl, { duration: "1d", type: "json" });
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    const playlistData = await EleventyFetch(playlistUrl, { duration: "1h", type: "json" });
    const videoIds = (playlistData.items || []).map(item => item.snippet.resourceId.videoId).filter(id => id);
    
    let upcomingVideos_detailed = [];
    let allVideos_detailed = []; // popularVideosで使うための変数
    
    if (videoIds.length > 0) {
        // ▼▼▼【変更】 statistics を part に追加 ▼▼▼
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const videosData = await EleventyFetch(videosUrl, { duration: "1h", type: "json" });
        
        allVideos_detailed = videosData.items || []; // 全ての詳細データを保持

        upcomingVideos_detailed = allVideos_detailed
            .filter(item => item.snippet.liveBroadcastContent === 'upcoming' && item.liveStreamingDetails?.scheduledStartTime)
            .sort((a, b) => new Date(a.liveStreamingDetails.scheduledStartTime) - new Date(b.liveStreamingDetails.scheduledStartTime));
    }

    // --- ▼▼▼【ここから新規追加】今月の人気動画ランキングのロジック ▼▼▼ ---
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const popularVideos = allVideos_detailed
      .filter(video => {
        const publishedAt = new Date(video.snippet.publishedAt);
        // ライブ配信のアーカイブなどは liveBroadcastContent が 'none' になるので、それも考慮
        return video.snippet.liveBroadcastContent !== 'upcoming' && publishedAt >= firstDayOfMonth && publishedAt <= lastDayOfMonth;
      })
      .sort((a, b) => {
          const statsA = a.statistics ? parseInt(a.statistics.viewCount, 10) : 0;
          const statsB = b.statistics ? parseInt(b.statistics.viewCount, 10) : 0;
          return statsB - statsA;
      })
      .slice(0, 5);
    // --- ▲▲▲【新規追加ここまで】▲▲▲ ---

    console.log("Data fetched successfully!");
    return {
      live: liveData,
      upcoming: upcomingData,
      planningPlaylist: rankedPlaylistData,
      liveVideo: liveVideo,
      upcomingVideos: upcomingVideos_detailed,
      popularVideos: popularVideos, // <-- データを追加
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
      popularVideos: [], // <-- エラー時も空配列を返す
      getPlaylistLastUpdate: async () => null
    };
  }
};