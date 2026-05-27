/**
 * Lightweight proxy for YouTube Data API v3.
 * Keeps the API key server-side while the browser fetches fresh data.
 *
 * Query params:
 *   type = "live" | "upcoming" | "latest" | "popular"
 */

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!API_KEY || !CHANNEL_ID) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "YouTube API configuration missing" }),
    };
  }

  const type = event.queryStringParameters?.type;

  try {
    let data;

    switch (type) {
      case "live":
        data = await fetchLiveStatus();
        break;
      case "upcoming":
        data = await fetchUpcoming();
        break;
      case "latest":
        data = await fetchLatestVideos();
        break;
      case "popular":
        data = await fetchPopularVideos();
        break;
      default:
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Invalid type. Use: live, upcoming, latest, popular" }),
        };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("YouTube proxy error:", error.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Failed to fetch YouTube data" }),
    };
  }
};

async function ytFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function getUploadsPlaylistId() {
  const data = await ytFetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`
  );
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
}

async function fetchLiveStatus() {
  const searchData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&eventType=live&type=video&maxResults=1`
  );

  if (!searchData.items?.length) {
    return { isLive: false, video: null };
  }

  const videoId = searchData.items[0].id.videoId;
  const details = await ytFetch(
    `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&part=snippet,liveStreamingDetails&id=${videoId}`
  );

  const video = details.items?.[0];
  const ld = video?.liveStreamingDetails;
  const isCurrentlyLive = ld?.actualStartTime && !ld?.actualEndTime;

  if (!isCurrentlyLive) return { isLive: false, video: null };

  return {
    isLive: true,
    video: {
      id: videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails?.medium?.url,
    },
  };
}

async function fetchUpcoming() {
  const uploadsId = await getUploadsPlaylistId();
  if (!uploadsId) return { videos: [] };

  const playlist = await ytFetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=20&key=${API_KEY}`
  );

  const ids = (playlist.items || []).map((i) => i.snippet.resourceId.videoId).filter(Boolean);
  if (!ids.length) return { videos: [] };

  const videosData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${ids.join(",")}&key=${API_KEY}`
  );

  const upcoming = (videosData.items || [])
    .filter((v) => v.snippet.liveBroadcastContent === "upcoming")
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      scheduledStart: v.liveStreamingDetails?.scheduledStartTime,
    }))
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart));

  return { videos: upcoming };
}

function parseDurationToSeconds(iso8601) {
  const match = iso8601?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || "0") * 3600) +
         (parseInt(match[2] || "0") * 60) +
         (parseInt(match[3] || "0"));
}

function isNotShort(video) {
  const duration = parseDurationToSeconds(video.contentDetails?.duration);
  return duration > 60;
}

async function fetchLatestVideos() {
  const uploadsId = await getUploadsPlaylistId();
  if (!uploadsId) return { videos: [] };

  const playlist = await ytFetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=20&key=${API_KEY}`
  );

  const ids = (playlist.items || []).map((i) => i.snippet.resourceId.videoId).filter(Boolean);
  if (!ids.length) return { videos: [] };

  const videosData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,liveStreamingDetails&id=${ids.join(",")}&key=${API_KEY}`
  );

  const now = new Date();
  const available = (videosData.items || [])
    .filter((v) => {
      const date = new Date(v.liveStreamingDetails?.scheduledStartTime || v.snippet.publishedAt);
      return date <= now && isNotShort(v);
    })
    .sort((a, b) => {
      const da = new Date(a.liveStreamingDetails?.scheduledStartTime || a.snippet.publishedAt);
      const db = new Date(b.liveStreamingDetails?.scheduledStartTime || b.snippet.publishedAt);
      return db - da;
    })
    .slice(0, 1)
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.medium?.url,
    }));

  return { videos: available };
}

async function fetchPopularVideos() {
  const uploadsId = await getUploadsPlaylistId();
  if (!uploadsId) return { videos: [] };

  const playlist = await ytFetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=50&key=${API_KEY}`
  );

  const ids = (playlist.items || []).map((i) => i.snippet.resourceId.videoId).filter(Boolean);
  if (!ids.length) return { videos: [] };

  const videosData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids.join(",")}&key=${API_KEY}`
  );

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const popular = (videosData.items || [])
    .filter((v) => {
      const pub = new Date(v.snippet.publishedAt);
      return v.snippet.liveBroadcastContent !== "upcoming" &&
             pub >= firstOfMonth && pub <= lastOfMonth &&
             isNotShort(v);
    })
    .sort((a, b) => {
      const va = parseInt(a.statistics?.viewCount || "0", 10);
      const vb = parseInt(b.statistics?.viewCount || "0", 10);
      return vb - va;
    })
    .slice(0, 5)
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      viewCount: parseInt(v.statistics?.viewCount || "0", 10),
    }));

  return { videos: popular };
}
