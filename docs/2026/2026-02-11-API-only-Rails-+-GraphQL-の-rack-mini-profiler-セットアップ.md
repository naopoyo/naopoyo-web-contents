---
draft: false
emoji: 🍶
title: API-only Rails + GraphQL の rack-mini-profiler セットアップ
slug: api-only-rails-graphql-rack-mini-profiler-setup
published_at: 2026-02-11 12:02:21
modified_at: 2026-02-11 12:02:21
tags:
  - Rails
  - GraphQL
  - Next.js
preview: null
---

## まとめ

- API-only では `auto_inject = false` とスナップショット経由の確認が前提になる
- `pre_authorize_cb` で UI アクセスとスナップショット記録を両立させる
- graphql-ruby の `trace_with` で operation 名ごとにプロファイルを分類できる

## 背景

Rails の API-only アプリケーションで GraphQL を使っていると、パフォーマンスの可視化が難しい。rack-mini-profiler は定番のプロファイリングツールだけど、2つの前提が噛み合わない。

1つ目は、API-only アプリには HTML レスポンスがないこと。rack-mini-profiler はデフォルトで HTML にプロファイル UI を注入するため、JSON しか返さない API では意味がない。

2つ目は、GraphQL が単一エンドポイントであること。REST なら URL ごとにプロファイルが分かれるが、GraphQL は全て `POST /graphql` に集約されてしまう。

この2つを解決する設定とコードを書いた。

## 導入

Gemfile の development グループに `require: false` で追加する。

```ruby:Gemfile
group :development do
  gem "rack-mini-profiler", require: false
end
```

## API-only 向けの設定

```ruby:config/initializers/rack_mini_profiler.rb
if Rails.env.development?
  require 'rack-mini-profiler'

  Rack::MiniProfilerRails.initialize!(Rails.application)

  Rack::MiniProfiler.config.tap do |c|
    c.auto_inject = false
    c.storage = Rack::MiniProfiler::MemoryStore
    c.snapshot_every_n_requests = 1
    c.snapshots_redact_sql_queries = false
    c.pre_authorize_cb = ->(env) { env['PATH_INFO'].start_with?('/mini-profiler-resources/') }
  end
end
```

| 設定                           | 説明                                         |
| ------------------------------ | -------------------------------------------- |
| `auto_inject`                  | レスポンス HTML へのプロファイル UI 自動注入 |
| `storage`                      | プロファイルデータの保存先                   |
| `snapshot_every_n_requests`    | スナップショットを記録するリクエスト間隔     |
| `snapshots_redact_sql_queries` | スナップショット内の SQL クエリの墨消し      |
| `pre_authorize_cb`             | リクエストごとの認可判定コールバック         |

`pre_authorize_cb` は少し補足が要る。rack-mini-profiler のスナップショットは「認可されていないリクエスト」に対してだけ記録される。`pre_authorize_cb` で mini-profiler UI へのリクエストだけ認可し、それ以外をスナップショットとして記録させている。

## GraphQL トレースモジュール

graphql-ruby 2.x の Trace API を使って、rack-mini-profiler の step にクエリ情報を記録する。

```ruby:rack_mini_profiler_trace.rb
module Tracers
  module MiniProfilerTrace
    STEP_KEY = :mini_profiler_dataloader_step

    def execute_query(query:)
      op_name = query.operation_name || 'anonymous'
      op_type = query.selected_operation&.operation_type || 'query'
      label = "GraphQL #{op_type}: #{op_name}"

      current = Rack::MiniProfiler.current
      if current
        current.page_struct[:name] = label
        current.page_struct[:request_path] = "/graphql [#{op_name}]"
      end

      Rack::MiniProfiler.step(label) { super }
    end

    def execute_query_lazy(query:, multiplex:)
      Rack::MiniProfiler.step('GraphQL lazy resolve') { super }
    end

    def begin_dataloader_source(source)
      step = Rack::MiniProfiler.start_step("Dataloader: #{source.class.name}")
      Fiber[STEP_KEY] = step
      super
    end

    def end_dataloader_source(source)
      step = Fiber[STEP_KEY]
      Rack::MiniProfiler.finish_step(step) if step
      Fiber[STEP_KEY] = nil
      super
    end
  end
end
```

### operation 名でのグループ化

スナップショットのグループ名は `rails_route_from_path` で決まる。何もしなければ全て `POST graphql#execute` に集約されてしまう。

`page_struct[:request_path]` を `/graphql [GetDocuments]` のように書き換えると、`rails_route_from_path` がルート認識に失敗して `nil` を返し、フォールバックとして `request_path` がグループ名に使われる。スナップショット一覧では operation 名ごとにグループ化される。

`page_struct[:name]` は個別の結果ページのタイトルに表示される。設定しないとリクエスト URL がそのまま表示されるため、`GraphQL query: GetDocuments` のようなラベルを入れておくと見分けやすい。

### Dataloader と Fiber

Dataloader のバッチロードは Fiber 上で実行されるため、step オブジェクトの保持に `Fiber[]`（Fiber ローカルストレージ）を使っている。Thread ローカル変数だと Fiber をまたいで干渉してしまう。

フィールドレベルのトレーシングは Fiber 間の干渉が複雑になるため、あえてスキップした。SQL クエリは rack-mini-profiler が `sql.active_record` 通知を自動購読するので、別途対応は不要だった。

## スキーマへの適用

BaseSchema に1行追加するだけで、継承先の全スキーマに適用される。

```ruby:app/graphql/base_schema.rb
class BaseSchema < GraphQL::Schema
  trace_with Tracers::MiniProfilerTrace if defined?(Rack::MiniProfiler)
end
```

`require: false` にしているため、開発環境以外では `Rack::MiniProfiler` が定義されず、この条件は自然に `false` になる。

## プロファイリングデータの確認方法

開発サーバー起動後、`/mini-profiler-resources/snapshots` にアクセスするとスナップショット一覧が表示される。個別のスナップショットをクリックすると、GraphQL の step や SQL クエリの詳細を確認できる。

## おまけ: Next.js (URQL) からプロファイル結果にアクセスする

API-only 構成ではフロントエンドとサーバーが別プロセスになるため、Next.js のサーバーサイドログからプロファイル結果に直接アクセスできると便利になる。

### Rails 側: レスポンスヘッダーにプロファイル ID を設定

GraphQL コントローラーで `authorize_request` を呼び、プロファイル ID とグループ名をヘッダーに設定する。

```ruby:app/controllers/graphql_controller.rb
def set_mini_profiler_header
  return unless defined?(Rack::MiniProfiler)

  current = Rack::MiniProfiler.current
  return unless current

  Rack::MiniProfiler.authorize_request

  page = current.page_struct
  request_path = page[:request_path] || '/graphql'
  response.set_header('MiniProfiler-Id', page[:id])
  response.set_header('MiniProfiler-Group', "POST #{request_path}")
end
```

`authorize_request` はミドルウェアに結果の保存を指示する。これがないと `/results?id=` でアクセスできない。スナップショットへの記録には影響しない。

### Next.js 側: URQL のカスタム fetch でログ出力する場合

`createClient` の `fetch` オプションでレスポンスヘッダーを読み取り、結果ページの URL をログに出力する。

```typescript:src/urql/urql-client.ts
const PROFILER_BASE_URL = 'http://localhost/mini-profiler-resources/results';

const fetchWithProfiler: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  const id = response.headers.get('MiniProfiler-Id');
  const group = response.headers.get('MiniProfiler-Group');
  if (id) {
    const operation = group?.match(/\[(.+)\]/)?.[1] ?? 'unknown';
    const params = new URLSearchParams({ id, ...(group && { group }) });
    console.log(`[MiniProfiler] ${operation} → ${PROFILER_BASE_URL}?${params}`);
  }
  return response;
};

const makeClient = () => {
  return createClient({
    url: API_URL,
    fetch: process.env.NODE_ENV === 'development' ? fetchWithProfiler : undefined,
    // ...
  });
};
```

Next.js のサーバーログに以下のように出力される。

```text
[MiniProfiler] operationName http://localhost/mini-profiler-resources/results?id=xxx&group=zzz
```

URL をブラウザで開くと、そのリクエストの step と SQL クエリの詳細を確認できる。
