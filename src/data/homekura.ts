/**
 * homeクラ 視聴者向けガイドライン（/homekura/）
 * 更新: コンテンツ変更はこのファイルを編集 → npm run build
 */
export const homekuraMeta = {
  pageTitle: "homeクラ 視聴者ガイド",
  description:
    "配信者専用 Minecraft サバイバル「homeクラ」の視聴者向けガイド。見方・スケジュール・流行語大賞・マナーなど。",
  updatedAt: "2026-06-19",
} as const;

export const homekuraIntro = {
  title: "homeクラ って？",
  lead:
    "配信者・クリエイターが集まる **Minecraft Java 版サバイバルサーバー** です。まぐにぃをはじめ、複数の参加者がそれぞれ配信・動画・録画しながら、同じワールドで遊びます。",
  points: [
    "視聴者の方は **サーバーに入らなくても**、配信や動画から楽しめます。",
    "「ただのサバイバル」から生まれる予測不能な展開を、みんなで見守る・盛り上げる場所です。",
    "シーズン制（Minecraft 公式アップデートに合わせてワールドリセット）で運営しています。",
  ],
} as const;

export const watchGuide = {
  title: "視聴の楽しみ方",
  items: [
    {
      icon: "📺",
      heading: "配信・動画を見る",
      body:
        "参加者それぞれのチャンネルから、同じワールドの別視点を楽しめます。まぐにぃのゲームch・実写chもあわせてチェックしてみてください。",
    },
    {
      icon: "🎙️",
      heading: "マルチ視点を楽しむ",
      body:
        "同じ出来事でも、配信者ごとにリアクションや切り口が違います。気になる人の配信を行き来するのも homeクラ ならではの楽しみ方です。",
    },
    {
      icon: "💬",
      heading: "コメント・X で参加する",
      body:
        "配信中のコメント、X（旧 Twitter）での感想・引用ポストなど、視聴者側からの声もコンテンツの一部です。温かく見守ってもらえると嬉しいです。",
    },
  ],
} as const;

export const scheduleItems = [
  {
    date: "6/30（月）21:00",
    title: "シーズン1 授賞式（YouTube 生配信）",
    detail:
      "統計ランキング 10 部門＋**流行語大賞**を発表します。配信はまぐにぃの YouTube から。",
    highlight: true,
  },
  {
    date: "6/30（月）24:00",
    title: "シーズン1 クローズ",
    detail: "授賞式のあともサーバーは開いていますが、深夜 0 時にシーズン1 が終了します。",
    highlight: false,
  },
  {
    date: "7/1（水）朝",
    title: "メンテナンス",
    detail: "新ワールド準備のため、この間は接続できません。",
    highlight: false,
  },
  {
    date: "7/1（水）21:00",
    title: "シーズン2 開始（全員集合）",
    detail:
      "参加者が初期スポーンに集合し、エリアガチャで拠点を決めてスタートします。視聴者の方は各配信からお楽しみください。",
    highlight: true,
  },
] as const;

export const buzzwordAward = {
  title: "流行語大賞（視聴者も参加 OK）",
  hashtag: "#homeクラ流行語",
  xPostUrl: "https://x.com/maguro29/status/2066687203015897375",
  steps: [
    "X で **#homeクラ流行語** を付けて、シーズン1 で生まれた名言・迷言・場の空気を投稿",
    "6/28 頃まで運営がノミネートを絞り込み",
    "6/30 21:00 の授賞式で投票・大賞発表（S2 の看板や称号に残るかも）",
  ],
  note: "Discord 参加者向けの追加リマインドは行いません。X だけ見ている方も、このページとハッシュタグで参加できます。",
} as const;

export const viewerGuidelines = {
  title: "視聴者の方へのお願い",
  dos: [
    "配信者・参加者・他の視聴者へのリスペクトを大切に",
    "配信や動画のネタバレは、タイトル・サムネ・コメントで配慮を",
    "批判や攻撃ではなく、応援やユーモアで盛り上げてもらえると助かります",
    "流行語大賞など、企画のルール（ハッシュタグなど）に沿って参加",
  ],
  donts: [
    "参加者の個人攻撃・過度なネガティブ連投",
    "配信・コメント欄での荒らし・スパム",
    "未公開の座標・内部情報の拡散（配信者が公開していない内容）",
    "「なぜ自分は入れないの」等、参加者以外への不当なプレッシャー",
  ],
} as const;

export const forCreators = {
  title: "配信者として参加したい方へ",
  body:
    "homeクラ は **配信者・クリエイター向けの招待制サーバー** です。参加希望や企画の相談は、まぐにぃの配信・X など公開されている窓口からお問い合わせください。視聴者ガイドの対象外の詳細（Mod・接続方法など）は参加者向け Discord で案内しています。",
} as const;

export const homekuraLinks = [
  {
    label: "まぐにぃ ゲームch",
    url: "https://www.youtube.com/@%E3%82%B2%E3%83%BC%E3%83%A0%E3%81%BE%E3%81%90%E3%81%AB%E3%81%83",
  },
  {
    label: "まぐにぃ 実写ch",
    url: "https://www.youtube.com/c/Maguro29Jp",
  },
  {
    label: "まぐにぃ X",
    url: "https://x.com/maguro29",
  },
  {
    label: "まぐにぃ情報ハブ（トップ）",
    url: "/",
    internal: true,
  },
] as const;
