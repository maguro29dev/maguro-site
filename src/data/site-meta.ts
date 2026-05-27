/**
 * サイト名・説明文の一元管理
 * タブタイトル / meta / PWA / フッター / manifest はすべてここを基準に揃えます。
 */
export const siteMeta = {
  /** サイトの正式名称 */
  siteName: "まぐにぃ情報ハブ",
  /** トップページのブラウザタブ */
  homeTitle: "まぐにぃ情報ハブ",
  /** meta description・OG・PWA */
  description:
    "まぐにぃの最新情報・配信予定・動画（ゲームch・実写ch）・メンバーシップをまとめた公式ファンサイト",
  /** フッター・コピーライト表記 */
  copyrightHolder: "まぐにぃ",
  /** PWA・ホーム画面追加 */
  pwaName: "まぐにぃ情報ハブ",
  pwaShortName: "まぐ情報",
  /** ヘッダーアイコンの alt */
  iconAlt: "まぐにぃ",
} as const;

/** Web App Manifest（Base.astro の link と prerender ルートで共用） */
export const webManifest = {
  name: siteMeta.pwaName,
  short_name: siteMeta.pwaShortName,
  description: siteMeta.description,
  icons: [
    {
      src: "/images/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/images/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
  start_url: "/?utm_source=pwa",
  scope: "/",
  display: "standalone",
  background_color: "#f7f7f5",
  theme_color: "#6a994e",
  shortcuts: [
    {
      name: "メンバーシップ",
      short_name: "メンバー",
      url: "/membership/?utm_source=pwa_shortcut",
      icons: [{ src: "/images/icon-96x96.png", sizes: "96x96" }],
    },
  ],
} as const;
