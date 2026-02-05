---
draft: false
emoji: ⚙️
title: VS Code で Markdown を快適に扱うための設定
slug: vscode-markdown-comfortable-settings
published_at: 2026-01-29 10:23:00
modified_at: 2026-02-05 19:38:24
tags:
  - VS Code
  - Markdown
  - 開発環境
preview: null
---

## プラグイン

以下のプラグインをインストールすると便利。

### Markdown All in One

Markdown 関連の便利機能が複数あるので、これだけでも十分。

::link-card[https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one]

```sh:Terminal
code --install-extension yzhang.markdown-all-in-one
```

```text:ID
yzhang.markdown-all-in-one
```

### Front Matter CMS

Markdown のファイルを CMS 管理できる。

::link-card[https://marketplace.visualstudio.com/items?itemName=eliostruyf.vscode-front-matter]

```sh:Terminal
code --install-extension eliostruyf.vscode-front-matter
```

```text:ID
eliostruyf.vscode-front-matter
```

#### 補足

- このプラグインを入れるとプレビューが次のようなショートカットに変わる。
  - `command` + `K` → `V`

### Markdown Preview Mermaid Support

プレビューに Mermaid を表示する。

::link-card[https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid]

```sh:Terminal
code --install-extension bierner.markdown-mermaid
```

```text:ID
bierner.markdown-mermaid
```

### markdownlint

構文やスタイルのチェックをして綺麗にフォーマットしてくれる。

::link-card[https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint]

```sh:Terminal
code --install-extension DavidAnson.vscode-markdownlint
```

```text:ID
DavidAnson.vscode-markdownlint
```

#### markdownlint の自動フォーマット設定

```json:.vscode/settings.json
"[markdown]": {
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.defaultFormatter": "DavidAnson.vscode-markdownlint",
},
```

### Markdown Table

テーブルの記述が楽になる。

::link-card[https://marketplace.visualstudio.com/items?itemName=TakumiI.markdowntable]

```sh:Terminal
code --install-extension TakumiI.markdowntable
```

```text:ID
TakumiI.markdowntable
```

### Markdown Named CodeBlocks

コードブロックにファイル名などを入れている場合に表示する。

::link-card[https://marketplace.visualstudio.com/items?itemName=tsutsu3.markdown-named-codeblocks]

```sh:Terminal
code --install-extension tsutsu3.markdown-named-codeblocks
```

```text:ID
tsutsu3.markdown-named-codeblocks
```
