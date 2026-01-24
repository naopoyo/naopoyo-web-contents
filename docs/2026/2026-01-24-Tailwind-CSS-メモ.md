---
draft: false
emoji: 🙃
title: Tailwind CSS メモ
slug: tailwind-css-notes
published_at: 2026-01-24 16:09:26
modified_at: 2026-01-24 16:09:26
tags:
  - Tailwind
  - CSS
preview: null
---

## eslint-plugin-better-tailwindcss

::link-card[https://github.com/schoero/eslint-plugin-better-tailwindcss]

### `HEADER_CLASS` のような定数に定義したクラスを対象にする

```typescript:eslint.config.mjs
const eslintConfig = defineConfig([
  // ...
    settings: {
      'better-tailwindcss': {
        variables: [
          [
            '^.*_CLASS$',
            [
              {
                match: 'strings',
              },
            ],
          ],
        ],
      },
    },
  // ...
])
```
