# まぐにぃゲーム実況本館 情報ハブサイト

Astroで構築した、YouTubeチャンネルの活動とメンバーシップに関する情報ハブサイトです。

## 主な機能

- **ライブ配信状況** - 配信中・配信予定をリアルタイムで表示（クライアントサイドで最新取得）
- **最新・人気動画** - 長尺動画のみ（ショート除外）
- **総合スケジュール** - 配信予定・リアルイベント・週間スケジュールを統合表示
- **メンバーシップ** - イベント、プラン、殿堂メンバー、想いを1ページに集約

## 技術スタック

| 領域 | 技術 |
|---|---|
| フレームワーク | [Astro](https://astro.build/) |
| CSS | [Tailwind CSS v4](https://tailwindcss.com/) |
| コンテンツ | `src/data/` の TypeScript ファイル |
| ホスティング | [Netlify](https://www.netlify.com/) |
| サーバーレス関数 | Netlify Functions（YouTube プロキシ） |

## ローカル開発

```bash
npm install
npm run dev
```

http://localhost:4321 でサイトを確認できます。

YouTube 連携は Netlify Functions 経由のため、ローカルでは動画・配信情報が空欄になることがあります（本番では正常動作）。

## Netlify 環境変数

| 変数名 | 用途 |
|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API |
| `YOUTUBE_CHANNEL_ID` | ゲーム実況ch のチャンネル ID |
| `YOUTUBE_CHANNEL_ID_JISSHA` | 実写ch のチャンネル ID（**任意**・未設定でOK。誤った値を入れると表示されません） |

実写chの正しい ID: `UCMJsF7fGuFUybKLjk7HqhfA`（[Maguro29Jp](https://www.youtube.com/c/Maguro29Jp)）

## コンテンツ更新

`src/data/` 内のファイルを編集してデプロイします。詳細は `.cursor/rules/content-update.mdc` を参照。

## デプロイ

`main` ブランチにプッシュすると Netlify が自動ビルド・デプロイします。
