// Eleventyのビルド時にデータを取得するためのユーティリティを読み込みます
const EleventyFetch = require("@11ty/eleventy-fetch");

// 環境変数からAPIキーを読み込みます
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCMP7QuS4suoONg47Nbi-wrg'; // 対象のYouTubeチャンネルID

/**
 * YouTube APIからデータを取得するメインの関数
 */
async function getYouTubeData() {
    // APIキーが設定されていない場合は警告を出し、処理を中断します
    if (!API_KEY) {
        console.warn("⚠️ YouTube APIキーが.envファイルに設定されていません。YouTubeのデータ取得をスキップします。");
        return {
            liveVideo: null,
            upcomingVideos: []
        };
    }

    try {
        // --- 1. 現在ライブ配信中の動画を取得 ---
        // Search:list APIを使い、現在ライブ中の動画を1件検索します。
        const liveSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`;
        const liveData = await EleventyFetch(liveSearchUrl, {
            duration: "5m", // 5分間キャッシュする
            type: "json"
        });
        const liveVideo = liveData.items && liveData.items.length > 0 ? liveData.items[0] : null;


        // --- 2. 配信予定の動画リストを取得（API使用量削減ロジック） ---
        // まず、チャンネル情報から「すべてのアップロード動画」がまとめられた再生リストのIDを取得します。
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
        const channelData = await EleventyFetch(channelUrl, { duration: "1d", type: "json" });
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // 次に、アップロード再生リストから最新50件の動画IDを取得します。
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`;
        const playlistData = await EleventyFetch(playlistUrl, { duration: "1h", type: "json" });
        const videoIds = (playlistData.items || []).map(item => item.snippet.resourceId.videoId).filter(id => id);

        if (videoIds.length === 0) {
             return { liveVideo, upcomingVideos: [] };
        }

        // 最後に、取得した動画IDリストを元に、各動画の詳細情報（特にライブ配信情報）を一括で取得します。
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds.join(',')}&key=${API_KEY}`;
        const videosData = await EleventyFetch(videosUrl, { duration: "1h", type: "json" });

        // 取得した動画の中から「配信予定(upcoming)」の動画のみをフィルタリングし、開始時間が早い順に並び替えます。
        const upcomingVideos = (videosData.items || [])
            .filter(item =>
                item.snippet.liveBroadcastContent === 'upcoming' &&
                item.liveStreamingDetails?.scheduledStartTime
            )
            .sort((a, b) => new Date(a.liveStreamingDetails.scheduledStartTime) - new Date(b.liveStreamingDetails.scheduledStartTime));

        // 取得したデータを返します
        return {
            liveVideo,
            upcomingVideos
        };

    } catch (error) {
        console.error("YouTube APIからのデータ取得中にエラーが発生しました:", error.message);
        // エラーが発生した場合は空のデータを返して、サイトのビルドが失敗しないようにします
        return {
            liveVideo: null,
            upcomingVideos: []
        };
    }
}

// この関数を実行し、結果をEleventyに渡します
module.exports = getYouTubeData;
