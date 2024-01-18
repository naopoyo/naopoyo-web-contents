---
draft: false
emoji: 🔮
title: ファイル移動時にMarkdownのリンクを自動的に変更するVS Codeの設定
slug: vscode-update-links-on-file-move
published_at: 2024-01-19 01:18:00
modified_at: 2024-01-19 01:18:00
tags:
    - Markdown
    - VS Code
preview: null
---

## 設定方法

```json:.vscode/settings.json
{
  "markdown.updateLinksOnFileMove.enabled": "prompt"
}
```

- `prompt`: 移動時に確認
- `always`: 自動的に変更
- `never`: 無効

このように設定することで、Markdownのファイルを移動したときにリンクを自動的に変更してくれます。

## 例

```text
.
├── a.md
└── b.md
```

```markdown:a.md
[b](b.md)
```

このような `a.md` があった場合、`b.md` のファイル名を `moved.md` に変更した場合に `a.md` は次のように自動的に変更されます。

```markdown:新しいa.mdの内容
[b](moved.md)
```

`![alt](example.png)` のような画像の場合も有効です。とても便利！

## 関連リンク

::link-card[https://github.com/microsoft/vscode/pull/163378]
