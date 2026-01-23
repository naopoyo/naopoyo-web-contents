---
draft: false
emoji: 🚈
title: Claude Code メモ
slug: claude-code-notes
published_at: 2026-01-22 19:00:33
modified_at: 2026-01-22 19:00:33
tags:
  - Claude Code
preview: null
---

## 概要

Claude Code の機能やテクニックを整理してる記事です。

## スキル

::link-card[https://code.claude.com/docs/ja/skills]

「特定の専門タスクを実行する手順」を教え込み、必要な時だけ自動的に呼び出させるための拡張機能です。

以下の記事では、`skill-creator` というスキルを作成するスキルを使った方法を解説しています。

::link-card[https://zenn.dev/aun_phonogram/articles/475f3cca8f40a3]

### Anthropic 公式スキルセットのインストール

以下のコマンドで、マーケットプレイスの追加、公式スキルセットのインストールを行います。

```sh:claude
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

### スキル・プラグイン関連コマンド

| コマンド  | 説明                                                     |
| --------- | -------------------------------------------------------- |
| `/skills` | 使用可能なスキルの確認                                   |
| `/plugin` | 追加したマーケットプレイスやインストールしたスキルの確認 |

## 仕様駆動開発（spec-kit）

::link-card[https://zenn.dev/gmomedia/articles/8ccf71e50858de]

::link-card[https://zenn.dev/flinters_blog/articles/b9eb3f9d308592]

::link-card[https://azukiazusa.dev/blog/spec-driven-development-with-spec-kit/]
