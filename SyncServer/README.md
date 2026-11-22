# QUIZ FORGE Sync Server

> 外出先から使うクラウド同期を始める場合は、まず [SUPABASE_BEGINNER.md](SUPABASE_BEGINNER.md) を読んでください。現在のアプリはSupabaseのProject URL・Publishable keyを入力する方式に対応しています。以下のNode.js + MySQL構成は、自分でサーバーを管理したい場合の旧来のローカル構成です。

個人利用向けのログイン・同期APIと、問題管理専用HTMLサイトです。MySQLにはユーザーごとのクイズデータをJSONとして保存します。既存の問題・履歴形式をそのまま同期できることを優先した構成です。

## 起動

1. MySQLで `schema.sql` を実行
2. `.env.example` を `.env` にコピーして接続情報を設定
3. 依存関係をインストールして起動

```powershell
npm install
npm start
```

Docker Desktopを使う場合は、代わりに次でMySQLを起動できます。

```powershell
docker compose up -d
Copy-Item .env.example .env
npm install
npm start
```

問題管理サイト：`http://localhost:3000/admin/`

最初にユーザー登録を行います。APIは `/api/auth/register`、`/api/auth/login`、`/api/data` を提供します。

PC版・スマホ版の画面右下にある「同期」から、API URL（同じPCで動かす場合は `http://localhost:3000`）を入力してログインします。スマホから自宅PCのAPIへ接続する場合は、PCのLAN IP、HTTPS、ファイアウォール設定が必要です。外部から安全に使う場合は、APIサーバーをHTTPS対応のホスティングへ配置してください。

本番公開時はHTTPS、強いJWT_SECRET、MySQLの外部公開制限、CORSの接続元固定を必ず設定してください。
