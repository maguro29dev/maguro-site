// src/_data/membership.js

const { DateTime } = require('luxon');
// Eleventyのデータカスケードの仕組みを利用するため、直接他のデータファイルを読み込む
const getSiteContent = require('./siteContent.js');
const getYoutubeData = require('./youtube.js');

module.exports = async function() {
    // 他のデータファイルを実行してデータを取得
    const siteContent = await getSiteContent();
    const youtube = await getYoutubeData();

    if (!siteContent || !siteContent.membershipBenefits) {
        console.warn("Membership benefits not found in siteContent. Returning empty.");
        return {
            benefits: [],
            hasNewBenefit: false,
            newBenefitTiers: [] // tiers with new benefits
        };
    }

    // NEW! と判断する期間（例：7日以内）
    const NEW_THRESHOLD_DAYS = 7;
    const now = DateTime.now();

    // Contentfulから取得した各特典を処理
    const processedBenefits = await Promise.all(
        siteContent.membershipBenefits.map(async (item) => {
            let isNew = false;
            let url = item.fields.staticUrl || '#'; // デフォルトURL

            // 1. YouTube再生リストID (playlistId) がある場合
            if (item.fields.playlistId) {
                const lastUpdateStr = await youtube.getPlaylistLastUpdate(item.fields.playlistId);
                if (lastUpdateStr) {
                    const lastUpdate = DateTime.fromISO(lastUpdateStr);
                    // 最終更新日が閾値以内かチェック
                    if (now.diff(lastUpdate, 'days').days <= NEW_THRESHOLD_DAYS) {
                        isNew = true;
                    }
                }
                url = `https://www.youtube.com/playlist?list=${item.fields.playlistId}`;
            } 
            // 2. YouTube再生リストIDがなく、手動NEWフラグ (manualNewFlag) がONの場合
            else if (item.fields.manualNewFlag) {
                isNew = true;
            }

            // 元のデータに、処理結果（isNew, url）を追加して返す
            return {
                ...item,
                isNew: isNew,
                url: url
            };
        })
    );

    // 1つでも「NEW」があれば、お知らせバナー表示用のフラグを立てる
    const hasNewBenefit = processedBenefits.some(item => item.isNew);
    
    // ▼▼▼【追加】どのプランに新しい特典があるか判別するロジック ▼▼▼
    const newBenefitTiers = [];
    if (hasNewBenefit) {
        processedBenefits.forEach(item => {
            if (item.isNew && !newBenefitTiers.includes(item.fields.tier)) {
                newBenefitTiers.push(item.fields.tier);
            }
        });
    }

    return {
        benefits: processedBenefits,
        hasNewBenefit: hasNewBenefit,
        newBenefitTiers: newBenefitTiers // 判別結果を返す
    };
};