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

Claude Code の機能やテクニックを整理した記事です。

## Claude Code ベストプラクティス

::link-card[https://code.claude.com/docs/en/best-practices]

## 通知を受け取る

以下の記事を参考に設定します。

::link-card[https://zenn.dev/the_exile/articles/claude-code-hooks]

::link-card[https://zenn.dev/gki/articles/1ee8d78a10ede2]

注意する点は

- Mac の設定で通知を許可する。Ghostty などを使っている場合はそのアプリの通知許可が必要かもしれない。

### 通知を受け取るための設定ファイル

次のような設定がされていれば良い。

```json:~/.claude/settings.json
{
  // ...
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code is waiting for you.\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  },
  // ...
}
```

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

### Skills.sh

以下のサイトでスキルを探すことができます。

::link-card[https://skills.sh/]

## 仕様駆動開発（spec-kit）

::link-card[https://zenn.dev/gmomedia/articles/8ccf71e50858de]

::link-card[https://zenn.dev/flinters_blog/articles/b9eb3f9d308592]

::link-card[https://azukiazusa.dev/blog/spec-driven-development-with-spec-kit/]

## 閉じてしまったセッションを再開する

以下のコマンドで直前のセッションを再開できる。`Ctrl + C` で閉じてしまった場合などに便利です。

```sh:Terminal
claude -c
claude --continue
```

次のコマンドであれば、過去のセッションから選んで再開することもできます。

```sh:Terminal
claude --resume
```

## Claude Code を使ってみてのメモ

- 使っているフレームワークのベストプラクティスをスキルにすると良い
  - React や Next.js などは skills.sh にあるものを使う
  - Rails は `skill-crator` を使って作った
- 「調査にはサブエージェントを使って」というとコンテクストの消費が緩やかになる気がする
- CLAUDE.md の修正も Claude Code にやらせるのが良い
  - 「Claude Code が既に知っている一般的な内容や冗長な記述は削除して」と言うとコンパクトにしてくれる
  - スキルの時もこれを言った方が良い
  - docs ディレクトリに詳細を分割して参照させるような構成も有効ß
- 大きいリファクタリングなどの作業はプランモードで計画を立ててからやるのが良い
  - 計画した作業を md で保存しておくとセッションが新しくなっても引き継げてる
    - プランモードを出ないと保存してくれない
  - フェーズに分けた計画を勝手に作ってくれるので、フェーズ毎に `/compact` すると良さそう
- スキルに `user-invocable: false` が設定されていると `/hoge-skill` のような使い方ができなくなる
- コミットスキルのように他のプロジェクトでも使いまわしたいものは、CLAUDE.md を参照するような記述をしておくと良い
  - 例）プロジェクトに `.claude/CLAUDE.md` が存在する場合、そこに記載された PR 作成ルールを確認し、適用してください。
