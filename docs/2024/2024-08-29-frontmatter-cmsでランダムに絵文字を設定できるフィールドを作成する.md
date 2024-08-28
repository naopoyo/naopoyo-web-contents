---
draft: false
emoji: 🐖
title: Front Matter CMSでランダムに絵文字を設定できるフィールドを作成する
slug: create-a-field-that-allows-random-emoji-setting-in-frontmatter-cms
published_at: 2024-08-29 00:27:40
modified_at: 2024-08-29 00:27:40
tags:
  - Front Matter CMS
  - Markdown
preview: null
---

## 事前に準備しておくこと

ローカル環境にNodeをインストールしておく必要があります。Macの場合は次の記事などを参考にnodeが使える環境を構築しましょう。ターミナルで `node -v` を実行してバージョンが表示される状態にしましょう。

- [Voltaでローカル環境にNode.jsをインストールしよう(macOS)](2024-07-19-voltaでローカル環境にnode.jsをインストールしよう.md)

## パッケージをインストール

Frontmatter CMSを利用しているプロジェクトに以下のようにパッケージをインストールします。

```sh:Terminal
pnpm add -D @frontmatter/extensibility
```

## スクリプトを作成

以下のようなスクリプトを作成します。

```javascript:.frontmatter/scripts/emoji-field.script.mjs
import { FieldAction } from '@frontmatter/extensibility';

(async () => {
  const value = makeRandomEmoji();

  FieldAction.update(value);
})();

function isEmoji(value) {
  const emojiRegex =
    /\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
  return emojiRegex.test(value);
}

function getRandomRange() {
  const emojiRanges = [
    { start: 0x1f600, end: 0x1f64f },
    { start: 0x1f300, end: 0x1f5ff },
    { start: 0x1f680, end: 0x1f6ff },
  ];

  const randomIndex = Math.floor(Math.random() * emojiRanges.length);
  return emojiRanges[randomIndex];
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeRandomEmoji() {
  let emoji = '';

  do {
    const randomRange = getRandomRange();
    const randomCodePoint = getRandomValue(randomRange.start, randomRange.end);
    emoji = String.fromCodePoint(randomCodePoint);
  } while (!isEmoji(emoji));

  return emoji;
}
```

## Frontmatter CMSの設定ファイルを修正

以下のハイライトしている行のように `actions` を設定することで、スクリプトを実行してフィールドに値を入力できるようになります。`script` には[スクリプトを作成](#スクリプトを作成)で作成したスクリプトのパスを設定しています。

```json:frontmatter.json
{
  "frontMatter.taxonomy.contentTypes": [
    {
      "name": "default",
      "pageBundle": false,
      "previewPath": null,
      "fields": [
        {
          "title": "Emoji",
          "name": "emoji",
          "type": "string",
          "single": true,
          "encodeEmoji": false,
          "actions": [ // [!code highlight]
            { // [!code highlight]
              "title": "Make random emoji", // [!code highlight]
              "script": ".frontmatter/scripts/emoji-field.script.mjs", // [!code highlight]
              "command": "node" // [!code highlight]
            } // [!code highlight]
          ] // [!code highlight]
        }
      ]
    }
  ]
}
```

## 参考

::link-card[https://frontmatter.codes/docs/content-creation/field-actions]
