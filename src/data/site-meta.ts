/**
 * サイト名・説明文の一元管理
 * ブラウザのタイトル、PWA名、各ページの見出しはここを基準に揃えます。
 */
export const siteMeta = {
  /** ブラウザタブ・検索結果用のサイト名 */
  siteName: "まぐにぃ情報ハブ",
  /** トップページのタイトル（タブに表示） */
  homeTitle: "まぐにぃ情報ハブ",
  /** meta description（検索・SNSプレビュー） */
  description:
    "まぐにぃの最新情報・配信予定・動画・メンバーシップをまとめた公式ファンサイト",
  /** PWA・ホーム画面追加時の名前 */
  pwaName: "まぐにぃ情報ハブ",
  pwaShortName: "まぐ情報",
} as const;
