# 外出先から使うクラウド同期（初心者向け）

Qu1zFr0ntierの同期先を、自宅PCではなくSupabaseにできます。Supabaseが問題データを預かるため、PCを起動していなくても外出先から同期できます。

## 1. Supabaseでプロジェクトを作る

1. [Supabase](https://supabase.com/)でアカウントを作成
2. New projectでプロジェクトを作成
3. DashboardのSQL Editorを開く
4. `supabase-setup.sql`の内容を貼り付けてRun
5. Project Settings → APIからProject URLとPublishable keyをコピー

アプリに貼り付けるのは「Project URL」と「Publishable key」です。`secret`キーは絶対にアプリへ貼り付けないでください。

## 2. アプリでログインする

PC版またはスマホ版で「同期」を開き、次を入力します。

- Supabase Project URL
- 公開用APIキー（Publishable key、古い画面ではanon key）
- メールアドレス
- パスワード

初回は「新規登録」、2台目以降は「ログイン」を押します。

## 3. 初回同期のルール

- Supabase側にデータがなく、端末に問題がある場合：端末の問題をクラウドへ保存
- Supabase側にデータがある場合：クラウドのデータを端末へ反映

最初の同期前に、設定画面からバックアップを書き出しておくと安心です。

## 4. 仕組み

```text
PC版 / スマホ版
   │  Project URL + Publishable key
   │  メールアドレス + パスワード
   ▼
Supabase Auth（ログイン確認）
   ▼
quiz_dataテーブル（ユーザーごとの問題データ）
```

APIキーは「このアプリからのアクセス」として使われます。誰のデータかは、Supabase Authのログイン情報で判定します。RLSというルールにより、ログインしたユーザーは自分の行だけを読める設定です。

## 注意

- Publishable keyはアプリに入れてよいキーですが、公開される前提です
- Secret key / service_role keyはアプリに入れないでください
- メール確認が有効な場合、新規登録後に確認メールを開いてからログインします
- 同じアカウントを複数人で共有すると、同じ問題データを上書きする可能性があります
- Supabaseの無料枠や仕様は変更されることがあるため、利用量はDashboardで確認してください
