---
draft: false
emoji: 😄
title: Next.jsでOpenTelemetryをはじめる
slug: getting-started-with-opentelemetry-in-nextjs
published_at: 2025-10-13 11:31:54
modified_at: 2025-10-13 11:31:54
tags:
  - OpenTelemetry
  - Next.js
preview: null
---

## パッケージのインストール

```bash:Terminal
pnpm add install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
```

## instrumentation.ts 作成

```ts:instrumentation.ts
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({ serviceName: 'next-app' })
}
```

## OpenTelemetry Collector（OTel Collector）をローカル開発環境で動かす

```bash:Terminal
git clone git@github.com:vercel/opentelemetry-collector-dev-setup.git
cd opentelemetry-collector-dev-setup
docker-compose up -d
```

コマンド実行後に以下で表示可能:

- Jaeger at http://localhost:16686
- Zipkin at http://localhost:9411
- Prometheus at http://localhost:9090

---

[開発日記-2025-10-11](2025-10-11-開発日記.md) に関連のリンクがある。
