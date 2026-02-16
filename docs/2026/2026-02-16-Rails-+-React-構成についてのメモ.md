---
draft: false
emoji: 🎼
title: Rails + React 構成についてのメモ
slug: rails-react-architecture-notes
published_at: 2026-02-16 23:36:27
modified_at: 2026-02-16 23:36:27
tags:
  - Rails
  - React
preview: null
---

## モノリスで React を使う方法

| 選択肢           | 概要                                          | 現状                                           |
| ---------------- | --------------------------------------------- | ---------------------------------------------- |
| Inertia.js       | コントローラから直接 props を渡す。API 層不要 | Laravel で標準化済み。Rails 側も活発           |
| React on Rails   | Rails ビュー内で React を SSR/CSR             | ShakaCode 1社依存。広がりは限定的              |
| Vite Rails + SPA | Vite で React SPA をビルド・配信              | ビルドツール統合であってフレームワークではない |
| jsbundling-rails | Rails 標準のバンドラー統合                    | シンプルだが React との連携は自前設計          |

この中だと Inertia.js が一番スタンダード。

## Inertia vs 分離構成

| 観点            | Inertia                   | Next.js + Rails API                |
| --------------- | ------------------------- | ---------------------------------- |
| API 設計        | 不要                      | 必要                               |
| デプロイ        | 1つ                       | 2つ                                |
| モバイル対応    | 別途 API が必要になる     | そのまま使える                     |
| 型の同期        | 手動                      | GraphQL/OpenAPI codegen で自動化可 |
| SSR             | Node プロセス追加で対応可 | 標準で組み込み                     |
| RSC / Streaming | 非対応                    | 対応                               |
| チーム分業      | しにくい                  | しやすい                           |
| 立ち上げ速度    | 速い                      | 遅い                               |

複雑さの総量は変わらない。どこに寄せるかだけ。

## SSR

- Inertia デフォルトは SSR ではない。初回 HTML の中身は空の div + JSON で、React がクライアント描画する
- SSR モードは Node プロセス追加で対応可。同一サーバー同居で動く
- Next.js は SSR 中に Rails API への HTTP リクエストが走る。Inertia は Rails が直接 DB を叩いた結果を Node に渡すだけ
- トータルのレイテンシはほぼ同等
- 差が出るのは RSC / Streaming SSR。コンポーネント単位の SSR/CSR 切り替えは Inertia にはない

SSR のパフォーマンスより、RSC が必要かどうかで選ぶ方が現実的。

## Hotwire

| 観点             | Hotwire                    | React                      |
| ---------------- | -------------------------- | -------------------------- |
| 思想             | サーバーが HTML を返す     | クライアントが状態から描画 |
| 構造化           | Stimulus コントローラ      | コンポーネント             |
| 型安全           | なし                       | TypeScript                 |
| 状態管理         | サーバー側                 | エコシステムが豊富         |
| テスト           | Rails のシステムテスト寄り | Testing Library, Storybook |
| フロント複雑化時 | 仕組みがない               | 対応できる                 |

jQuery 的な匂いがする。スコープが閉じている分マシだが、宣言的 UI やコンポーネント指向とは違う世界。

## 型安全

| 構成                             | 型の同期方法                             |
| -------------------------------- | ---------------------------------------- |
| Inertia                          | 手動定義。ズレは実行時まで気づけない     |
| Inertia + types_from_serializers | シリアライザから生成。まだ成熟していない |
| 分離構成 + GraphQL codegen       | スキーマから自動生成                     |
| 分離構成 + OpenAPI codegen       | スキーマから自動生成                     |

- Laravel には Laravel Data（PHP クラスから TS 型を自動生成）があるが、Rails 側に同等のものがない
- Ruby が動的型付けなので型情報の源泉がない
- GraphQL codegen で解決はできるが、そこまでやるなら分離構成でいい気もする

## Islands Architecture

| 条件         | うまくいく       | 辛くなる           |
| ------------ | ---------------- | ------------------ |
| 島の数       | 少ない（1〜2個） | 多い（5個以上）    |
| 島同士の連携 | 不要             | state を共有したい |
| 島の役割     | 独立した入力装置 | ページ全体の制御   |

- グローバル state は Rails（DB + セッション）が持ち、島の中だけ React の state を使う
- 島同士で state 共有が必要になると、別々の createRoot なので Context が効かず外部ストア必須
- Next.js の RSC は Islands のやりたいことをフレームワークとして統合したもの

島が増えて連携し始めたら「最初から全面 React で」となるパターンが多いらしい。

## 今のところの感触

- フロントの複雑さがプロダクトの価値に直結するなら React ベース
- CRUD 中心なら Hotwire や Inertia で十分
- Inertia か分離構成かは、型安全と SSR をどこまで求めるか次第
