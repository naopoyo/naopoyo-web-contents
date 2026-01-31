---
draft: false
emoji: 🧜‍♀️
title: beautiful-mermaid を使ってみた
slug: trying-beautiful-mermaid
published_at: 2026-02-01 01:20:08
modified_at: 2026-02-01 01:20:08
tags:
  - Markdown
preview: null
---

## 概要

::link-card[https://github.com/lukilabs/beautiful-mermaid]

beautiful-mermaid で出力するようにしてみたので、サンプルを色々作ってみた。

## Mermaid サンプル1 - フローチャート

```mermaid
flowchart TD
    A[開始] --> B{ログイン済み?}
    B -->|Yes| C[ダッシュボード表示]
    B -->|No| D[ログイン画面]
    D --> E[認証処理]
    E -->|成功| C
    E -->|失敗| D
    C --> F[終了]
```

## Mermaid サンプル2 - シーケンス図

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant A as API
    participant D as データベース

    U->>F: ボタンクリック
    F->>A: POST /api/data
    A->>D: INSERT クエリ
    D-->>A: 結果
    A-->>F: JSON レスポンス
    F-->>U: 完了通知
```

## Mermaid サンプル3 - クラス図

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
        +fetch()
    }
    class Cat {
        +String color
        +meow()
        +scratch()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## Mermaid サンプル4 - 状態遷移図

```mermaid
stateDiagram-v2
    [*] --> 下書き
    下書き --> レビュー中: 提出
    レビュー中 --> 修正中: 差し戻し
    レビュー中 --> 承認済み: 承認
    修正中 --> レビュー中: 再提出
    承認済み --> 公開: デプロイ
    公開 --> [*]
```

## Mermaid サンプル5 - ER図

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string name
        string email
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int id PK
        int user_id FK
        date created_at
    }
    ORDER_ITEM }|--|| PRODUCT : references
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT {
        int id PK
        string name
        decimal price
    }
```

## Mermaid サンプル6 - ガントチャート

```mermaid
gantt
    title プロジェクトスケジュール
    dateFormat YYYY-MM-DD
    section 設計
        要件定義      :a1, 2026-02-01, 7d
        UI設計        :a2, after a1, 5d
    section 開発
        フロントエンド :b1, after a2, 14d
        バックエンド   :b2, after a2, 14d
    section テスト
        単体テスト    :c1, after b1, 5d
        結合テスト    :c2, after c1, 5d
```

## Mermaid サンプル7 - 円グラフ

```mermaid
pie showData
    title 言語別コード割合
    "TypeScript" : 45
    "JavaScript" : 25
    "CSS" : 15
    "HTML" : 10
    "Other" : 5
```

## Mermaid サンプル8 - Gitグラフ

```mermaid
gitGraph
    commit id: "初期コミット"
    branch feature/auth
    checkout feature/auth
    commit id: "ログイン機能追加"
    commit id: "認証ミドルウェア"
    checkout main
    merge feature/auth
    branch feature/api
    commit id: "API実装"
    checkout main
    merge feature/api
    commit id: "リリース v1.0"
```

## Mermaid サンプル9 - マインドマップ

```mermaid
mindmap
    root((Webアプリ))
        フロントエンド
            React
            Next.js
            TailwindCSS
        バックエンド
            Node.js
            Express
            PostgreSQL
        インフラ
            AWS
            Docker
            GitHub Actions
```

## Mermaid サンプル10 - タイムライン

```mermaid
timeline
    title フロントエンド技術の進化
    2015 : React登場
         : ES6標準化
    2016 : Vue.js 2.0
         : Webpack普及
    2020 : Next.js人気化
         : TypeScript主流に
    2023 : React Server Components
         : Astro/Qwik登場
```

## Mermaid サンプル11 - ユーザージャーニー図

```mermaid
journey
    title ECサイトでの購入体験
    section 商品探し
        サイト訪問: 5: ユーザー
        商品検索: 4: ユーザー
        商品詳細確認: 5: ユーザー
    section 購入手続き
        カートに追加: 5: ユーザー
        会員登録: 2: ユーザー
        住所入力: 3: ユーザー
        決済: 4: ユーザー
    section 購入後
        確認メール受信: 5: ユーザー
        配送待ち: 3: ユーザー
        商品受け取り: 5: ユーザー
```

## Mermaid サンプル12 - 象限チャート

```mermaid
quadrantChart
    title Technology Selection Matrix
    x-axis Low Learning Cost --> High Learning Cost
    y-axis Low Productivity --> High Productivity
    quadrant-1 Worth Considering
    quadrant-2 Top Priority
    quadrant-3 Avoid
    quadrant-4 Depends on Context
    React: [0.7, 0.85]
    Vue: [0.45, 0.75]
    Svelte: [0.35, 0.7]
    Angular: [0.8, 0.6]
    jQuery: [0.2, 0.3]
    Vanilla JS: [0.3, 0.4]
```

## Mermaid サンプル13 - XYチャート

```mermaid
xychart-beta
    title "Monthly Sales Trend"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Sales (10K JPY)" 0 --> 500
    bar [120, 150, 180, 220, 280, 350]
    line [100, 130, 160, 200, 250, 320]
```

## Mermaid サンプル14 - サンキー図

```mermaid
sankey-beta

Visitors,Home,1000
Home,Product List,600
Home,Bounce,400
Product List,Product Detail,400
Product List,Bounce,200
Product Detail,Cart,200
Product Detail,Bounce,200
Cart,Purchase Complete,150
Cart,Bounce,50
```

## Mermaid サンプル15 - ブロック図

```mermaid
block-beta
columns 3
    Frontend["フロントエンド\nNext.js"]
    space
    Backend["バックエンド\nNode.js"]

    space space space

    CDN["CDN\nCloudflare"]
    LB["ロードバランサー"]
    Cache["キャッシュ\nRedis"]

    space space space

    DB[("データベース\nPostgreSQL")]:3

    Frontend --> CDN
    Backend --> LB
    LB --> Cache
    Cache --> DB
```

## Mermaid サンプル16 - 要件図

```mermaid
requirementDiagram

requirement UserAuth {
id: 1
text: Login with email and password.
risk: medium
verifymethod: test
}

requirement SessionMgmt {
id: 2
text: Keep session for 24 hours.
risk: low
verifymethod: test
}

element AuthModule {
type: module
}

element JWTLibrary {
type: library
}

AuthModule - satisfies -> UserAuth
AuthModule - satisfies -> SessionMgmt
AuthModule - traces -> JWTLibrary
```
