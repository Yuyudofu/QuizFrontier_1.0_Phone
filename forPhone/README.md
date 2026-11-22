# QUIZ FORGE — SmartPhone Version

縦向きのスマホ利用を前提にした独立版です。`Web` フォルダがアプリの画面本体で、元のWindows版とは別に管理できます。

無料で自分のiPhoneだけで使う場合は、iOSネイティブビルドではなくPWAとしてホーム画面に追加できます。`Web/manifest.json` とService Workerを含めているため、対応するHTTPS URLで公開すれば、Safariのアドレスバーなしでアプリのように起動できます。

## スマホ版の操作

- 問題カードを左へフリック：不正解
- 問題カードを右へフリック：正解
- 下部の「不正解」「答えを見る」「正解」ボタンでも操作可能
- 問題カードを短くタップ：答えを見る
- 横向きになった場合は、縦向きに戻す案内を表示

## Windowsで行う準備

PowerShellでこのフォルダへ移動し、次を実行します。

```powershell
npm install
npm run web:check
```

## 無料でiPhoneに追加する方法

1. `SmartPhone Version` の中身（`Web`、`package.json`、`.github`など）をGitHubリポジトリのルートにアップロードする
2. GitHubリポジトリの Settings → Pages で Source を GitHub Actions にする
3. `main` ブランチへpushし、`Deploy QUIZ FORGE PWA` の完了後に表示されるURLを確認する
4. iPhoneのSafariでそのURLを開く
5. 共有ボタン →「ホーム画面に追加」→「ウェブアプリとして開く」を有効化
6. ホーム画面のQUIZ FORGEアイコンから起動する

Appleの案内でも、ホーム画面に追加したWebサイトはアプリのように開けます。インストール後はSafariのタブ画面ではなく、独立したWebアプリとして起動します。

ここまではWindowsで完了します。`ios` フォルダの生成とiOS実機・IPAのビルドはAppleのXcodeが必要なため、Windows単体では完結できません。

## WindowsだけでiOSビルドへ進む方法

WindowsからmacOSのCI環境を使います。GitHubへこのプロジェクトを置き、`.github/workflows/ios-preflight.yml` を含めてpushしたあと、GitHubのActions画面から **iOS preflight build** を手動実行してください。

このワークフローはmacOS上で以下を行います。

1. `npm ci`
2. `npx cap add ios`
3. `npx cap sync ios`
4. iOSの対応向きを縦向きだけに設定
5. 署名なしのiOS Simulator向けビルド
6. 生成された `ios` プロジェクトをActionsのArtifactとして保存

この段階は「Xcodeで開いて署名・実機用にビルドする前」までです。実機に入れるIPAやApp Store提出版を作るには、Apple Developerアカウント、証明書・Provisioning Profile、CIへの署名設定が別途必要です。

## Macを使える場合の次のコマンド

ArtifactまたはフォルダをMacへ持ってきて、次を実行します。

```bash
npm ci
npm run ios:prepare
npx cap open ios
```

XcodeでTeam、Bundle Identifier、Signingを設定してから実機を選び、Buildします。Capacitor公式手順でも、iOSプロジェクトの生成は `npx cap add ios`、Web資産の反映は `npx cap sync`、Xcodeで開く場合は `npx cap open ios` です。
