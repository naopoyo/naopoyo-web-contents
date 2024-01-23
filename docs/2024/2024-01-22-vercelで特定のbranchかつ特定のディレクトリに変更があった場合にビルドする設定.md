---
draft: false
emoji: 🍮
title: Vercelで特定のbranchかつ特定のディレクトリに変更があった場合にビルドする設定
slug: configure-vercel-to-build-when-changes-occur-in-a-specific-branch-and-directory
published_at: 2024-01-24 00:57:43
modified_at: 2024-01-24 00:57:43
tags:
  - Next.js
  - Vercel
preview: null
---

## 解説

```tree:リポジトリのディレクトリ構成
(Project root)
├── client
└── server
```

このように一つのリポジトリでclientとserverを分けていて、clientのディレクトリ以下をVercelにデプロイしたい場合の方法です。この時、pushされたブランチも `main` に限定します。以下の記事の設定に対象のディレクトリの指定を追加したものになります。

::link-card[https://zenn.dev/catnose99/articles/b37104fc7ef214]

まず、VercelのRoot Directoryの設定は `client` になっていることを確認して下さい。

次に Ignored Build Step: を `Run my Bash script` にして、値を `bash scripts/vercel-ignore-build-step.sh` にします。スクリプトはclientディレクトリ上で実行されるため、clientディレクトリ以下に設置するようにして下さい。この設定で指定したファイルを以下のように作成します。

```bash:client/scripts/vercel-ignore-build-step.sh
#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"
git diff HEAD^ HEAD --quiet .
DIFF=$?

if [[ "$VERCEL_GIT_COMMIT_REF" == "main" && DIFF -eq 1 ]] ; then
  # Proceed with the build
  echo "✅ - Build can proceed"
  exit 1;

else
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
fi
```

### コードの解説

```bash:Gitコマンドで差分を確認する
git diff HEAD^ HEAD --quiet .
DIFF=$?
```

この行で、clientディレクトリに差分が発生しているかを確認しています。`$?` は、直前に実行されたコマンドの終了ステータスを示す環境変数です。`git diff` では変更がある場合に1を返し、変更がない場合に0を返します。`DIFF -eq 1` の部分で差分がある場合にビルドするように判定しています。

以上で、mainブランチへのpushでclientディレクトリに変更がある場合のみビルドが実行されるようになります。
