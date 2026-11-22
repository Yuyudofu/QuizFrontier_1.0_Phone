# Firebase同期の設定（初心者向け）

Firebaseを使うと、自宅PCを起動していなくても外出先から同期できます。

## 1. Firebaseプロジェクトを作る

1. [Firebase Console](https://console.firebase.google.com/)を開く
2. 「プロジェクトを追加」でプロジェクトを作る
3. 左メニューの「構築」→「Authentication」を開く
4. Sign-in providerで「メール/パスワード」を有効にする
5. 「Firestore Database」を作成する
6. Webアプリ（`</>`のアイコン）を追加する

## 2. Firestoreルールを設定する

Firestoreの「ルール」画面で、[firebase-firestore.rules](firebase-firestore.rules)の内容を貼り付けて公開します。

このルールにより、ログイン中のユーザーは自分のデータだけを読み書きできます。

## 3. アプリに設定値を入力する

Firebase Console → プロジェクトの設定 → マイアプリ → 作成したWebアプリの設定から、次の6項目をコピーします。

- apiKey → API Key
- authDomain → Auth Domain
- projectId → Project ID
- storageBucket → Storage Bucket
- messagingSenderId → Messaging Sender ID
- appId → App ID

アプリの「同期」画面へ貼り付け、「新規登録」または「ログイン」を押します。

設定値はFirebaseのWebアプリ用公開設定です。Firebaseの秘密鍵やサービスアカウントJSONは、アプリに貼り付けないでください。

## 4. データの保存場所

```text
Firebase Authentication
  └─ メールアドレス・パスワード・ユーザーID

Cloud Firestore
  └─ quizData / ユーザーID
       └─ 問題・セット・履歴をJSONとして保存
```

初回ログイン時、Firestoreにデータがなく端末に問題がある場合は端末の問題をアップロードします。Firestoreにすでにデータがある場合は、クラウドのデータを端末へ反映します。

## 無料枠について

FirebaseのSparkプランには無料枠がありますが、読み書き回数・保存容量などの上限があります。上限を超えると、そのサービスが当月利用できなくなる場合があります。個人用の少量の問題データなら、通常は十分小さい利用量です。
