/**
 * Lightweight proxy for YouTube Data API v3.
 * Keeps the API key server-side while the browser fetches fresh data.
 *
 * Query params:
 *   type = "live" | "upcoming" | "latest" | "popular" | "shorts" | "latest-jissha" | "home"
 */

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
/** まぐにぃチャンネル（実写） https://www.youtube.com/c/Maguro29Jp */
const CHANNEL_ID_JISSHA_DEFAULT = "UCMJsF7fGuFUybKLjk7HqhfA";
const CHANNEL_ID_JISSHA = (process.env.YOUTUBE_CHANNEL_ID_JISSHA || CHANNEL_ID_JISSHA_DEFAULT).trim();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};

/**
 * Best-effort in-memory cache (per warm function instance).
 * Helps reduce YouTube API quota usage under burst traffic.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 30 * 60 * 1000;
const QUOTA_ERROR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map(); // key -> { ts, data, isError?, errorTtl? }
const uploadsPlaylistCache = new Map(); // channelId -> { id, ts }
const UPLOADS_CACHE_TTL_MS = 60 * 60 * 1000;

function getErrorCacheTtl(reason) {
  if (reason === "quotaExceeded") return QUOTA_ERROR_CACHE_TTL_MS;
  if (reason === "rateLimitExceeded") return ERROR_CACHE_TTL_MS;
  return 5 * 60 * 1000;
}

function getCachedEntry(cacheKey) {
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  const ttl = cached.isError ? cached.errorTtl ?? ERROR_CACHE_TTL_MS : CACHE_TTL_MS;
  if (Date.now() - cached.ts >= ttl) {
    cache.delete(cacheKey);
    return null;
  }
  return cached;
}

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
    const cacheKey = `type:${type}`;
    const cached = getCachedEntry(cacheKey);
    if (cached) {
      if (cached.isError) {
        return {
          statusCode: 502,
          headers: { ...CORS_HEADERS, "X-Cache": "ERROR-HIT" },
          body: JSON.stringify(cached.data),
        };
      }
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, "X-Cache": "HIT" },
        body: JSON.stringify(cached.data),
      };
    }

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
      case "shorts":
        data = await fetchShortVideos();
        break;
      case "latest-jissha":
        data = await fetchLatestJissha();
        break;
      case "home":
        data = await fetchHomeBundle();
        break;
      default:
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: "Invalid type. Use: live, upcoming, latest, popular, shorts, latest-jissha, home",
          }),
        };
    }

    cache.set(cacheKey, { ts: Date.now(), data });
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data),
    };
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : undefined;
    const reason = typeof error?.reason === "string" ? error.reason : undefined;
    const message = typeof error?.message === "string" ? error.message : String(error);
    console.error("YouTube proxy error:", message, status, reason);
    const errorBody = {
      error: "Failed to fetch YouTube data",
      status,
      reason,
    };
    const errorTtl = getErrorCacheTtl(reason);
    if (reason === "quotaExceeded" || reason === "rateLimitExceeded") {
      cache.set(cacheKey, { ts: Date.now(), data: errorBody, isError: true, errorTtl });
    }
    return {
      statusCode: status && status >= 400 && status < 600 ? 502 : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify(errorBody),
    };
  }
};

async function ytFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let reason;
    try {
      const body = await res.json();
      reason = body?.error?.errors?.[0]?.reason || body?.error?.message;
    } catch {
      // ignore
    }
    const err = new Error(`YouTube API ${res.status}: ${res.statusText}`);
    err.status = res.status;
    if (reason) err.reason = String(reason);
    throw err;
  }
  return res.json();
}

async function getUploadsPlaylistId(channelId = CHANNEL_ID) {
  const cached = uploadsPlaylistCache.get(channelId);
  if (cached && Date.now() - cached.ts < UPLOADS_CACHE_TTL_MS) {
    return cached.id;
  }

  const data = await ytFetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
  );
  const uploadsId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (uploadsId) {
    uploadsPlaylistCache.set(channelId, { id: uploadsId, ts: Date.now() });
  }
  return uploadsId;
}

/** search.list は 100 units/回 — プレイリスト経由でライブ判定（節約） */
async function fetchLiveStatus() {
  const uploadsId = await getUploadsPlaylistId();
  if (!uploadsId) return { isLive: false, video: null };

  const playlist = await ytFetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=5&key=${API_KEY}`
  );

  const ids = (playlist.items || [])
    .map((i) => i.snippet?.resourceId?.videoId)
    .filter(Boolean);
  if (!ids.length) return { isLive: false, video: null };

  const videosData = await ytFetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${ids.join(",")}&key=${API_KEY}`
  );

  const live = (videosData.items || []).find((v) => {
    const ld = v.liveStreamingDetails;
    return ld?.actualStartTime && !ld?.actualEndTime;
  });

  if (!live) return { isLive: false, video: null };

  return {
    isLive: true,
    video: {
      id: live.id,
      title: live.snippet.title,
      thumbnail: live.snippet.thumbnails?.medium?.url,
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

/** 長尺: 3分以上（60秒超のショートを除外） */
const LONG_FORM_MIN_SECONDS = 180;

function isLongForm(video) {
  const duration = parseDurationToSeconds(video.contentDetails?.duration);
  return duration >= LONG_FORM_MIN_SECONDS;
}

function isShortForm(video) {
  const duration = parseDurationToSeconds(video.contentDetails?.duration);
  return duration > 0 && duration < LONG_FORM_MIN_SECONDS;
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
      return date <= now && isLongForm(v);
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
             isLongForm(v);
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

async function fetchShortVideos() {
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

  const shorts = (videosData.items || [])
    .filter((v) => {
      const pub = new Date(v.snippet.publishedAt);
      return v.snippet.liveBroadcastContent !== "upcoming" &&
             pub >= firstOfMonth && pub <= lastOfMonth &&
             isShortForm(v);
    })
    .sort((a, b) => {
      const va = parseInt(a.statistics?.viewCount || "0", 10);
      const vb = parseInt(b.statistics?.viewCount || "0", 10);
      return vb - va;
    })
    .slice(0, 6)
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.medium?.url,
      viewCount: parseInt(v.statistics?.viewCount || "0", 10),
    }));

  return { videos: shorts };
}

/** 実写ch: 最新1本（search 不使用でクォータ節約） */
async function fetchLatestJissha() {
  const uploadsId = await getUploadsPlaylistId(CHANNEL_ID_JISSHA);
  if (!uploadsId) return { videos: [], channelId: CHANNEL_ID_JISSHA };

  const playlist = await ytFetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=10&key=${API_KEY}`
  );

  for (const item of playlist.items || []) {
    const videoId = item.snippet?.resourceId?.videoId;
    if (!videoId) continue;
    if (item.snippet?.liveBroadcastContent === "upcoming") continue;

    return {
      videos: [
        {
          id: videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url,
        },
      ],
      channelId: CHANNEL_ID_JISSHA,
    };
  }

  return { videos: [], channelId: CHANNEL_ID_JISSHA };
}

/** トップページ用: まとめて取得してクォータ節約（約5 units/回） */
async function fetchHomeBundle() {
  const [gameUploads, jisshaUploads] = await Promise.all([
    getUploadsPlaylistId(CHANNEL_ID),
    getUploadsPlaylistId(CHANNEL_ID_JISSHA),
  ]);

  let gamePlaylistItems = [];
  if (gameUploads) {
    const playlist = await ytFetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${gameUploads}&maxResults=50&key=${API_KEY}`
    );
    gamePlaylistItems = playlist.items || [];
  }

  const gameIds = [
    ...new Set(
      gamePlaylistItems.map((i) => i.snippet?.resourceId?.videoId).filter(Boolean)
    ),
  ];

  let videoItems = [];
  if (gameIds.length) {
    const videosData = await ytFetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${gameIds.join(",")}&key=${API_KEY}`
    );
    videoItems = videosData.items || [];
  }

  const byId = new Map(videoItems.map((v) => [v.id, v]));

  const live = (() => {
    for (const id of gameIds.slice(0, 5)) {
      const v = byId.get(id);
      if (!v) continue;
      const ld = v.liveStreamingDetails;
      if (ld?.actualStartTime && !ld?.actualEndTime) {
        return {
          isLive: true,
          video: {
            id: v.id,
            title: v.snippet.title,
            thumbnail: v.snippet.thumbnails?.medium?.url,
          },
        };
      }
    }
    return { isLive: false, video: null };
  })();

  const upcoming = {
    videos: videoItems
      .filter((v) => v.snippet.liveBroadcastContent === "upcoming")
      .map((v) => ({
        id: v.id,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        scheduledStart: v.liveStreamingDetails?.scheduledStartTime,
      }))
      .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart)),
  };

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const latest = {
    videos: videoItems
      .filter((v) => {
        const date = new Date(v.liveStreamingDetails?.scheduledStartTime || v.snippet.publishedAt);
        return date <= now && isLongForm(v);
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
      })),
  };

  const popular = {
    videos: videoItems
      .filter((v) => {
        const pub = new Date(v.snippet.publishedAt);
        return (
          v.snippet.liveBroadcastContent !== "upcoming" &&
          pub >= firstOfMonth &&
          pub <= lastOfMonth &&
          isLongForm(v)
        );
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
      })),
  };

  const shorts = {
    videos: videoItems
      .filter((v) => {
        const pub = new Date(v.snippet.publishedAt);
        return (
          v.snippet.liveBroadcastContent !== "upcoming" &&
          pub >= firstOfMonth &&
          pub <= lastOfMonth &&
          isShortForm(v)
        );
      })
      .sort((a, b) => {
        const va = parseInt(a.statistics?.viewCount || "0", 10);
        const vb = parseInt(b.statistics?.viewCount || "0", 10);
        return vb - va;
      })
      .slice(0, 6)
      .map((v) => ({
        id: v.id,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        viewCount: parseInt(v.statistics?.viewCount || "0", 10),
      })),
  };

  let jissha = { videos: [], channelId: CHANNEL_ID_JISSHA };
  if (jisshaUploads) {
    const jisshaPlaylist = await ytFetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${jisshaUploads}&maxResults=10&key=${API_KEY}`
    );
    for (const item of jisshaPlaylist.items || []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!videoId || item.snippet?.liveBroadcastContent === "upcoming") continue;
      jissha = {
        videos: [
          {
            id: videoId,
            title: item.snippet.title,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.default?.url,
          },
        ],
        channelId: CHANNEL_ID_JISSHA,
      };
      break;
    }
  }

  return { live, upcoming, latest, popular, shorts, jissha };
}
