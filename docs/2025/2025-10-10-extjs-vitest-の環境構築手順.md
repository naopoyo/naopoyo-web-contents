---
draft: false
emoji: 🍕
title: Next.js + Vitest の環境構築手順
slug: nextjs-and-vitest-environment-setup-guide
published_at: 2025-10-10 00:24:00
modified_at: 2025-10-13 22:17:09
tags:
  - Vitest
  - Next.js
preview: null
---

## 参考

::link-card[https://nextjs.org/docs/app/guides/testing/vitest]

## 必要なパッケージのインストール

```bash:Terminal
pnpm add -D -E vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @vitest/coverage-v8
```

## 設定ファイルの作成

```ts:vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

## package.json の scripts

package.json の scripts を次のように設定することで便利になります。

```json:package.json
{
  "scripts": {
    // ...
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:run": "vitest run"
    // ...
  },
}
```
