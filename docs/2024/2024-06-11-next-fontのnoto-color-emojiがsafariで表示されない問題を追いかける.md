---
draft: false
emoji: 😞
title: next/fontのNoto_Color_Emojiがsafariで表示されない問題を追いかける
slug: investigate-the-issue-of-noto-color-emoji-from-next-font-not-displaying-on-safari
published_at: 2024-06-11 22:27:55
modified_at: 2024-06-11 22:27:55
tags:
  - Next.js
preview: null
---

## Xの投稿

::x-post[https://x.com/naopoyo_tw/status/1713518679508541874]

## 問題

[next/font](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts)のNoto_Color_EmojiがMacやiPhoneのSafariで表示されない。

下記の関連リンクにあるようにSafariでのNoto Emojの表示自体に色々問題がある様子。なので色々と調べたことをここにメモしていく。

## 関連

::link-card[https://zenn.dev/kazzyfrog/articles/736651a7430a19]
::link-card[https://qiita.com/mei331/items/204c669444e446eedd7b]
::link-card[https://github.com/googlefonts/noto-emoji/issues/438]
