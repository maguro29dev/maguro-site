# YouTubeチャンネル情報ハブサイト「まぐろのサイト」

Eleventyで構築した、YouTubeチャンネルの活動とメンバーシップに関する情報ハブサイトです。

このサイトは、日々の活動スケジュールや動画情報を集約するだけでなく、**メンバーシップの各プラン内容や、その背景にある想いを伝える**ことで、ファンとのより深い関係性を築くことを目的としています。

コンテンツはヘッドレスCMSのContentfulで管理し、Netlifyでホスティングしています。

## 主な機能

このサイトは、ファンコミュニティのための情報を集約したポータルサイトです。トップページでは以下の情報を一目で確認できます。

- **ライブ配信状況**
  - 現在配信中のライブや、次の配信予定までのカウントダウンをリアルタイムで表示します。

- **最新・人気動画**
  - 最新の投稿動画と、今月の人気動画ランキングを表示します。

- **総合スケジュール**
  - 「配信予定」「リアルイベント情報」「週ごとの固定スケジュール」を統合して表示します。
  - スケジュール部分は画像として保存できる機能も備えています。

- **メンバーシップ特典一覧**
  - プラン（「全プラン共通」「中トロ以上」「大トロ限定」）ごとに特典を分かりやすく整理して表示します。

- **殿堂入りメンバーページ**
  - チャンネルを特に力強く支援しているメンバー（「大トロ」プラン加入者）を「殿堂」として紹介する専用ページです。
  - 掲載に同意したメンバーのアイコンや名前が一覧表示され、コミュニティへの貢献を称えています。

- **インタラクティブな企画会議ページ**
  - Firebaseを全面的に活用した、ファン参加型の企画会議ページを設けています。
  - **リアルタイムホワイトボード**: 管理者が編集可能な共有ホワイトボードで、企画の進行状況などを共有します。
  - **アイデア投稿箱**: ファンは匿名で企画のアイデアを投稿でき、双方向のコミュニケーションを実現しています。
  - **企画のモーダル表示**: 決定した企画はカード形式で表示され、クリックすると詳細がモーダルで表示されます。この内容は画像として保存・シェアも可能です。
  - **管理者機能**: 特定の管理者アカウントのみがホワイトボードの編集やアイデアの管理を行える、認証機能も実装されています。

- **メンバー限定イベントページ**
  - メンバーシップ加入者向けのイベント情報を集約したページです。
  - **開催予定イベント**: 募集中のイベント概要や申込リンクを掲載。イベント情報は画像としてシェアすることも可能です。
  - **イベントレポート**: 過去に開催されたイベントの様子をレポートとして読むことができ、コミュニティの活動記録を辿ることができます。

- **活動のアーカイブページ**
  - 過去の「企画」や「イベントレポート」を蓄積・閲覧できる専用のアーカイブページです。
  - コンテンツは時系列で並べ替えが可能で、コミュニティのこれまでの活動の歴史をいつでも振り返ることができます。

- **グッズ・コミュニティ情報**
  - 最新のグッズ情報や、コミュニティのルール、匿名のご意見箱へのリンクを集約しています。

- **コンテンツ管理**
  - スケジュールやイベント、特典などの情報は、ヘッドレスCMSの[Contentful](https://www.contentful.com/)を通じて管理されています。

- **自動更新と通知**
  - YouTubeチャンネルの更新をトリガーにサイトが自動で再構築され、購読者にはプッシュ通知が送信されます。

## アーキテクチャ / 使用技術

- **静的サイトジェネレーター**: [Eleventy](https://www.11ty.dev/)
- **CMS**: [Contentful](https://www.contentful.com/)
- **ホスティング & CI/CD**: [Netlify](https://www.netlify.com/)
- **サーバーレス関数**: [Netlify Functions](https://docs.netlify.com/functions/overview/)
- **プッシュ通知**: [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) & [Firestore](https://firebase.google.com/docs/firestore)
- **テンプレート言語**: Nunjucks
- **言語**: JavaScript (Node.js)

## ローカルでの開発手順

1.  **リポジトリをクローン**
    ```bash
    git clone https://github.com/maguro29/maguro-site.git
    ```

2.  **依存パッケージをインストール**
    ```bash
    npm install
    ```

3.  **環境変数を設定**
    プロジェクトルートに`.env`ファイルを作成し、必要なキーを記述します。

    ```env
    # Contentful API
    CTF_SPACE_ID=YOUR_CONTENTFUL_SPACE_ID
    CTF_ACCESS_TOKEN=YOUR_CONTENTFUL_ACCESS_TOKEN

    # Netlify Build Hook (for YouTube Webhook)
    BUILD_HOOK_URL=YOUR_NETLIFY_BUILD_HOOK_URL
    WEBHOOK_SECRET=YOUR_YOUTUBE_WEBHOOK_SECRET

    # Firebase Admin SDK (JSONを一行に圧縮して設定)
    FIREBASE_ADMIN_CONFIG=YOUR_FIREBASE_SERVICE_ACCOUNT_JSON

    # Web Push VAPID Keys
    VAPID_SUBJECT=mailto:YOUR_EMAIL@EXAMPLE.COM
    VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
    VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
    ```

4.  **開発サーバーを起動**
    ```bash
    npm start
    ```
    [http://localhost:8080](http://localhost:8080) でサイトを確認できます。

## デプロイ

`main`ブランチにプッシュすると、Netlifyが自動的にビルドとデプロイを実行します。