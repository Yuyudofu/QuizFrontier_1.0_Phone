# QUIZ FORGE Built

GASで外出先同期を設定する場合は、まず [GAS Sync/README.md](GAS%20Sync/README.md) を読んでください。最大30,000問、デッキ別同期、詳細履歴を送らない構成に対応しています。

用途別に分けた完成・配布用ファイルです。

## PC向け

Windows用のportable exeです。インストール不要で起動できます。

## スマホ向け

iPhone向けのPWA版と、CapacitorでiOS化する前のプロジェクトです。

## web向け

ブラウザで使うPC・Web版のHTML/CSS/JavaScriptです。GitHub Pagesなどで公開できます。

## 同期サーバー

ログイン、MySQL保存、PC/スマホ同期、問題管理サイトです。`README.md`を確認してください。

## GitHubを使った今後の手順

### 1. GitHubリポジトリを作る

GitHubで新しいリポジトリを作成します。リポジトリ名は、例えば `quiz-forge` にします。

この `Built` フォルダの中身を、リポジトリのルートにアップロードしてください。つまり、GitHub上で最初から次のように見える状態にします。

```text
.github/
PC向け/
スマホ向け/
web向け/
同期サーバー/
README.md
```

`Built` フォルダそのものをさらに入れ子にして、`quiz-forge/Built/...` にしないのがポイントです。

PowerShellからアップロードする場合は、GitHubで作ったリポジトリURLを使って次を実行します。

```powershell
cd "Built"
git init
git branch -M main
git add .
git commit -m "Organize QUIZ FORGE builds"
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

GitHub Desktopを使う場合は、`Built` フォルダをリポジトリとして選び、CommitとPushを行います。

### 2. GitHub Pagesでスマホ版を公開する

1. GitHubリポジトリの `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` を `GitHub Actions` にする
4. `main` ブランチへpushする
5. `Deploy smartphone PWA` が完了するまで待つ
6. Actions画面またはPages画面に表示されたURLをiPhoneで開く
7. Safariの共有メニューから「ホーム画面に追加」→「ウェブアプリとして開く」を選ぶ

以後はiPhoneのホーム画面から、Safariのアドレスバーなしでスマホ版を起動できます。

### 3. PC版を使う

GitHubから `PC向け/QUIZ-FORGE-1.0.0-portable.exe` をダウンロードして、Windowsで起動します。

同期サーバーを使う場合は、PC版の画面右下にある「同期」からAPI URLを設定します。APIを同じPCで起動する場合は `http://localhost:3000` です。

### 4. 問題管理サイトを起動する

ローカルでMySQLとAPIを起動します。

```powershell
cd "同期サーバー"
docker compose up -d
Copy-Item .env.example .env
npm install
npm start
```

その後、`http://localhost:3000/admin/` を開いてログインまたは新規登録します。

### 5. iOSプロジェクトを準備する

GitHubのActions画面で `iOS preflight build` を手動実行します。これはmacOS上でCapacitorのiOSプロジェクトを生成し、Simulator用にビルドします。完成したiOSプロジェクトはActionsのArtifactからダウンロードできます。

実機用の署名済みIPAやApp Store公開には、Apple Developerの署名設定が別途必要です。自分のiPhoneだけで使う場合は、まずGitHub PagesのPWA版を使う方法が最も簡単です。
