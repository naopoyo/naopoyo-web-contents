---
draft: false
emoji: 🌮
title: json-kifu-formatを使って独自の将棋の棋譜プレーヤーを作る
slug: use-json-kifu-format-to-build-custom-shogi-kifu-player
published_at: 2025-10-05 12:31:15
modified_at: 2025-10-05 12:31:15
tags:
  - 将棋
  - React
preview: null
---

## 概要

[Kifu for JS](https://kifu-for-js.81.la/)がReact 19で動かないので作ることにした。React 19で動く修正コードのプルリクエストを出したりするのがカッコ良いのだろうけれど大変そうなので断念。

json-kifu-format と shogi.js というライブラリがとても素晴らしいので自分でプレーヤーを作る方が簡単。棋譜データからの盤面情報の構築、駒を動かす処理など全て揃っている。

この記事では上記ライブラリを使用して独自の将棋プレーヤーを作ろうという時に参考になるかもしれない情報を残しておく。

## JKFPlayer

- 棋譜のテキスト・ファイルをパースして盤面や持ち駒の状態をオブジェクト化する
- `JKFPlayer.parse` でオブジェクトを作って棋譜を操作することで、盤面や持ち駒の状態が更新される
- JKFPlayerにはstaticな便利メソッドも豊富にある

```ts
const kifuText = `
...

手数----指手---------消費時間--
   1 ６八飛(28)   (00:04/00:00:04)
*▲戦型：四間飛車
*▲備考：振り飛車
   2 ３四歩(33)   (00:17/00:00:17)

...
`;

const player = JKFPlayer.parse(kifuText.trim());
```

## 盤面の情報

`player.shogi.board` に読み込んだ棋譜の初期盤面が入っている。`Piece` の二次元配列。

この情報を元にプレーヤーの駒の配置を表示する。

この情報は `player.forward();` や `player.backward();` などで手数を進めたり戻したりすると変更される。

## 持ち駒の情報

`player.shogi.hands` に持ち駒の情報が入っている。`Piece` の二次元配列。

`player.shogi.hands[0]` は先手の持ち駒。`player.shogi.hands[1]` は後手の持ち駒。

## JKFPlayerの便利なstaticメソッド

- `numToZen(n: number): string`  
  数字を全角に変換
- `numToKan(n: number): string`  
  数字を漢数字に変換
- `kindToKan(kind: Kind): string`  
  `Kind` を漢字に変換
- `moveToReadableKifu(mv: IMoveFormat): string`  
  `IMoveFormat` を `６八飛` のような文字列に変換
