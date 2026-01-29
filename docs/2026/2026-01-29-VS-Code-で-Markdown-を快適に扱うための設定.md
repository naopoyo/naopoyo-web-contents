---
draft: false
emoji: ⚙️
title: VS Code で Markdown を快適に扱うための設定
slug: vscode-markdown-comfortable-settings
published_at: 2026-01-29 10:23:00
modified_at: 2026-01-29 10:23:00
tags:
  - VS Code
  - Markdown
  - 開発環境
preview: null
---

## 自動フォーマット

```json:.vscode/settings.json
"[markdown]": {
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.defaultFormatter": "DavidAnson.vscode-markdownlint",
},
```
