# Front Matter 自動設定コマンド

以下のガイドラインに沿って Front Matter を自動設定する。

## Front Matter 設定ガイドライン

- `emoji` が空の場合は絵文字をランダムに設定する
- `slug` が空の場合は次のように生成した値を設定する
  1. `title` の値を英訳する
  2. 半角英数字以外は取り除く
  3. 英字は全て小文字にする
  4. スペースは `-` に変換する
- `tags` が**空の場合**は `title` 、本文をもとに @.frontmatter/database/taxonomyDb.json から適切なタグを設定する
  - 特にその記事の特徴を表すタグ設定する
  - 個数は1つ以上、3つ以下とする
  - 以下の例のようなフォーマットで設定する

    ```:yaml
    tags:
      - 開発日記
      - Next.js
    ```

## 例外の `slug` について

開発日記の `slug` は `diary-yyyy-mm-dd` (例:diary-2025-09-30) とする
