---
draft: false
emoji: 🦂
title: Tailwind CSSのカスタムクラス名をVS Codeで補完されるように追加する
slug: add-custom-class-names-of-tailwind-css-to-be-auto-completed-in-vs-code
published_at: 2023-10-21 19:03:10
modified_at: 2023-10-21 19:03:10
tags:
    - Tailwind
    - CSS
preview: null
---

## 概要

`@layer components` を使わずに `tailwind.config.ts` にカスタムクラス名を定義することで、VS Codeの入力補完に表示させるようにします。

## @layer componentsを使った方法

```css:globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .grid-template-rows-subgrid {
    grid-template-rows: subgrid;
  }
}
```

この方法ではVS Codeの拡張機能を使った場合に入力補完されません。

## tailwind.config.tsに追加する

以下のように `tailwind.config.ts` の `plugins` に追加することで、入力補完の候補に出てくるようになります。また、eslint-plugin-tailwindcssのWarning tailwindcss/no-custom-classnameも発生しなくなります。

```typescript:tailwind.config.ts
import plugin from 'tailwindcss/plugin'

// ...

const config: Config = {
  // ...
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.grid-template-rows-subgrid': {
          'grid-template-rows': 'subgrid',
        },
      })
    }),
  ],
}
```
