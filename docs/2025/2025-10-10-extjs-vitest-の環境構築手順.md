---
draft: false
emoji: 🍕
title: Next.js + Vitest の環境構築手順
slug: nextjs-and-vitest-environment-setup-guide
published_at: 2025-10-10 00:24:00
modified_at: 2026-01-23 19:03:19
tags:
  - Vitest
  - Next.js
preview: null
---

## 必要なパッケージのインストール

```bash:Terminal
pnpm add -D -E vitest @vitest/browser-playwright @vitejs/plugin-react @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths msw @vitest/coverage-v8 fishery @faker-js/faker
```

## 設定ファイルの作成

```ts:vitest.config.mts
import { defineConfig, defineProject } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['**/__tests__/**/*.unit.{test,spec}.ts'],
          environment: 'node',
        },
      }),
      defineProject({
        plugins: [tsconfigPaths(), react()],
        test: {
          name: 'browser',
          include: ['**/__tests__/**/*.browser.{test,spec}.ts{,x}'],
          setupFiles: ['./vitest.setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      }),
    ],
  },
})
```

```typescript:vitest.setup.ts
import '@testing-library/jest-dom/vitest'
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

## 参考

::link-card[https://nextjs.org/docs/app/guides/testing/vitest]

::link-card[https://zenn.dev/globis/articles/d98ea21ce0b887]

::link-card[https://www.epicweb.dev/why-i-won-t-use-jsdom]

::link-card[https://qiita.com/masafumi1073/items/54507efc02e167a64e73]
