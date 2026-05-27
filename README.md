# まぐにぃ情報ハブ

まぐにぃの公式ファンサイト（Astro）。ゲームchの配信・メンバーシップに加え、実写chの動画もちら見せできます。

## 主な機能

- **ライブ配信状況** - ゲームchの配信中・配信予定をリアルタイム表示
- **動画** - ゲームch（3分以上の長尺・ショート）+ 実写ch（最新1本）
- **総合スケジュール** - 配信予定・リアルイベント・週間スケジュール
- **メンバーシップ** - イベント、プラン、殿堂メンバー、想い

## サイト名・説明文の変更

**`src/data/site-meta.ts`** を編集してください。タブタイトル・meta・PWA manifest はここから自動で揃います。

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
| `YOUTUBE_CHANNEL_ID` | ゲームch のチャンネル ID |
| `YOUTUBE_CHANNEL_ID_JISSHA` | 実写ch（任意・未設定でOK） |

実写ch ID: `UCMJsF7fGuFUybKLjk7HqhfA`（[Maguro29Jp](https://www.youtube.com/c/Maguro29Jp)）

## コンテンツ更新

`src/data/` 内のファイルを編集してデプロイ。詳細は `.cursor/rules/content-update.mdc` を参照。

## デプロイ

`main` ブランチにプッシュすると Netlify が自動ビルド・デプロイします。
