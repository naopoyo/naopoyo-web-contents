---
draft: false
emoji: 🧪
title: Rails 8 で作る RSpec テスト環境
slug: rails-8-rspec-test-environment
published_at: 2026-02-05 20:52:41
modified_at: 2026-02-05 20:52:41
tags:
  - Rails
  - Rspec
  - Ruby
preview: null
---

Rails 8.1 と RSpec 8.0 を使ったテスト環境の構築手順をまとめました。

## この記事のポイント

- RSpec 8.0 + Rails 8.1 の基本設定
- test-prof の `let_it_be` でテストを高速化
- SimpleCov でカバレッジを可視化
- shoulda-matchers でモデルテストを簡潔に
- WebMock で外部 API をスタブ化

## Gemfile

2026年2月時点での推奨バージョンです。

```ruby
group :development, :test do
  gem "rspec-rails", "~> 8.0"
  gem "factory_bot_rails", "~> 6.5"
  gem "faker", "~> 3.6"
end

group :test do
  gem "shoulda-matchers", "~> 7.0"
  gem "simplecov", require: false
  gem "simplecov-console", require: false
  gem "webmock"
  gem "test-prof", "~> 1.4"
end
```

| gem               | 役割                                                                |
| ----------------- | ------------------------------------------------------------------- |
| rspec-rails       | RSpec を Rails で使うためのアダプタ。8.0 で Rails 8 に完全対応      |
| factory_bot_rails | テストデータを簡潔に作成できる。`create(:user)` のような DSL を提供 |
| faker             | `Faker::Name.name` のようにリアルなダミーデータを生成               |
| shoulda-matchers  | バリデーションやアソシエーションを一行でテストできる                |
| simplecov         | テストカバレッジを計測し、HTML レポートを生成                       |
| webmock           | 外部 HTTP リクエストをスタブ化。API テストを安定させる              |
| test-prof         | `let_it_be` 等でテストデータの作成を最適化し、実行速度を改善        |

gem を追加したらインストールを実行し、RSpec の初期ファイルを生成します。

```bash
# gem をインストール
bundle install

# .rspec, spec/spec_helper.rb, spec/rails_helper.rb を生成
bundle exec rails generate rspec:install
```

生成されたファイルをベースに、以降のセクションで設定をカスタマイズしていきます。

## spec_helper.rb

`spec_helper.rb` は RSpec 全体の設定ファイルです。Rails に依存しない設定をここに書きます。

主な設定内容は以下の通りです。

- SimpleCov によるカバレッジ計測の設定
- RSpec の期待値（expectations）とモック（mocks）の振る舞い設定
- テスト終了後のクリーンアップ処理

テスト実行後、`coverage/index.html` をブラウザで開くとカバレッジレポートを確認できます。どのコードがテストされていないかが一目でわかるので、テストの抜け漏れを防げます。

```ruby
# frozen_string_literal: true

require 'simplecov'
require 'simplecov-console'

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    # カスタムマッチャーで chain を使ったときに説明文へ含める
    # 例: be_bigger_than(2).and_smaller_than(4) の説明が
    # "be bigger than 2 and smaller than 4" になる
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    # 存在しないメソッドをモック/スタブしようとするとエラーになる
    # メソッド名のタイポや、実装変更後のモック漏れを検出できる
    mocks.verify_partial_doubles = true
  end

  # shared_context のメタデータを継承する方式を設定
  # RSpec 4 ではこれがデフォルトになる予定
  config.shared_context_metadata_behavior = :apply_to_host_groups

  SimpleCov.start do
    # ターミナルと HTML の両方にレポート出力
    # CI ではターミナル出力、ローカルでは HTML が便利
    formatter SimpleCov::Formatter::MultiFormatter.new([
      SimpleCov::Formatter::HTMLFormatter,
      SimpleCov::Formatter::Console
    ])

    # テストコードと設定ファイルはカバレッジ計測から除外
    add_filter '/spec/'
    add_filter '/config/'

    # レポートをディレクトリ別にグループ化
    # 「Models: 95%」「Services: 87%」のように表示される
    add_group 'Models', 'app/models'
    add_group 'Controllers', 'app/controllers'
    add_group 'Services', 'app/services'
    add_group 'Jobs', 'app/jobs'
  end
end
```

## rails_helper.rb

`rails_helper.rb` は Rails 環境でのテスト設定ファイルです。モデルやコントローラなど、Rails の機能を使うテストはこのファイルを require します。

主な設定内容は以下の通りです。

- FactoryBot のメソッドを直接呼び出せるようにする設定
- WebMock による外部リクエストのブロック設定
- トランザクションによるテストデータの自動クリーンアップ
- shoulda-matchers の統合設定

```ruby
# frozen_string_literal: true

require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort('The Rails environment is running in production mode!') if Rails.env.production?
require 'rspec/rails'
require 'webmock/rspec'

# 外部 HTTP リクエストをブロック（localhost は許可）
# スタブ化し忘れた外部リクエストがあるとテストが失敗するので、
# 意図しない外部通信を防げる
WebMock.disable_net_connect!(allow_localhost: true)

# spec/support 以下のファイルを自動読み込み
# ヘルパーモジュールや共通設定をここに配置できる
Rails.root.glob('spec/support/**/*.rb').each { |f| require f }

# テスト実行前にマイグレーションが最新かチェック
# 未適用のマイグレーションがあるとエラーメッセージを表示して終了
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  # フィクスチャファイルの配置先
  config.fixture_paths = [Rails.root.join('spec/fixtures').to_s]

  # create(:user) のように FactoryBot. のプレフィックスを省略できる
  # build, create, build_list, create_list なども同様
  config.include FactoryBot::Syntax::Methods

  # 各テストをトランザクションで囲み、終了後に自動ロールバック
  # テスト間でデータが干渉することを防ぐ
  config.use_transactional_fixtures = true

  # ファイルの配置場所からテストの種類を自動推測
  # spec/models/ に置けば type: :model、spec/requests/ なら type: :request
  config.infer_spec_type_from_file_location!

  # エラー時のバックトレースから Rails 内部のコードを除外
  # 自分のコードに集中できる
  config.filter_rails_from_backtrace!
end

# shoulda-matchers を RSpec + Rails で使う設定
# この設定により、モデルスペックで validate_presence_of などが使える
Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end
```

## test-prof で高速化

test-prof は Evil Martians が開発したテスト高速化ツールです。特に `let_it_be` と `before_all` が強力で、テストデータの作成コストを大幅に削減できます。

`spec/support/test_prof.rb` を作成します。

```ruby
# frozen_string_literal: true

require 'test_prof/recipes/rspec/let_it_be'
require 'test_prof/recipes/rspec/before_all'
```

### let_it_be とは

`let_it_be` は `let` の高速版です。

通常の `let` は各 example（it ブロック）の前に毎回ブロックを実行します。10個のテストがあれば、10回データベースに INSERT されます。

`let_it_be` は describe ブロック全体で一度だけ実行し、結果を全 example で共有します。10個のテストがあっても、INSERT は1回だけです。

```ruby
RSpec.describe User do
  # 各 example で毎回 User が作成される（遅い）
  let(:user) { create(:user) }

  # describe 全体で 1 回だけ作成される（速い）
  let_it_be(:user) { create(:user) }
end
```

### reload オプション

共有オブジェクトをテスト内で変更すると、他のテストに影響します。`reload: true` を指定すると、各 example の前にオブジェクトがデータベースからリロードされ、変更がリセットされます。

```ruby
# 各 example の前に user.reload が呼ばれる
let_it_be(:user, reload: true) { create(:user) }
```

### before_all との違い

`before_all` はインスタンス変数を使う版です。`let_it_be` と同様に一度だけ実行されますが、`@user` のようにアクセスします。

```ruby
before_all do
  @user = create(:user)
  @posts = create_list(:post, 5, user: @user)
end
```

複数の関連オブジェクトをまとめてセットアップしたい場合は `before_all` が便利です。

## 使用例

### モデルテスト（shoulda-matchers）

shoulda-matchers を使うと、バリデーションやアソシエーションのテストが一行で書けます。手動で書くと数行かかるテストを、宣言的に記述できます。

```ruby
RSpec.describe User, type: :model do
  describe 'バリデーション' do
    # validates :email, presence: true と同等のテスト
    it { is_expected.to validate_presence_of(:email) }

    # validates :email, uniqueness: { case_sensitive: false } と同等
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }

    # validates :name, length: { maximum: 100 } と同等
    it { is_expected.to validate_length_of(:name).is_at_most(100) }
  end

  describe 'アソシエーション' do
    # belongs_to :tenant と同等のテスト
    it { is_expected.to belong_to(:tenant) }

    # has_many :posts, dependent: :destroy と同等
    it { is_expected.to have_many(:posts).dependent(:destroy) }
  end
end
```

### 外部 API テスト（WebMock）

WebMock を使うと、外部 API を実際に呼び出さずにテストできます。

外部 API に依存したテストには以下の問題があります。

- ネットワーク障害でテストが失敗する
- API のレート制限に引っかかる
- テストが遅くなる
- 本番データを変更してしまう可能性がある

WebMock でリクエストをスタブ化すると、これらの問題を回避できます。

```ruby
RSpec.describe GithubService do
  describe '#fetch_user' do
    before do
      # このURLへのGETリクエストをスタブ化
      stub_request(:get, 'https://api.github.com/users/octocat')
        .to_return(
          status: 200,
          body: { login: 'octocat', id: 1 }.to_json,
          headers: { 'Content-Type' => 'application/json' }
        )
    end

    it 'ユーザー情報を取得する' do
      user = GithubService.new.fetch_user('octocat')
      expect(user['login']).to eq 'octocat'
    end
  end
end
```

エラーケースも簡単にテストできます。実際の API で 404 を再現するのは難しいですが、WebMock なら一行です。

```ruby
context 'ユーザーが存在しない場合' do
  before do
    stub_request(:get, 'https://api.github.com/users/unknown')
      .to_return(status: 404)
  end

  it 'nil を返す' do
    expect(GithubService.new.fetch_user('unknown')).to be_nil
  end
end
```

タイムアウトのテストも可能です。

```ruby
context 'タイムアウトした場合' do
  before do
    stub_request(:get, 'https://api.github.com/users/octocat')
      .to_timeout
  end

  it '例外を発生させる' do
    expect { GithubService.new.fetch_user('octocat') }
      .to raise_error(Faraday::ConnectionFailed)
  end
end
```

## ディレクトリ構成

最終的なディレクトリ構成は以下のようになります。

```tree
spec/
├── factories/          # FactoryBot のファクトリ定義
│   ├── users.rb
│   └── posts.rb
├── fixtures/
│   └── files/          # テスト用の画像などのファイル
│       └── sample.png
├── models/             # モデルのテスト
│   └── user_spec.rb
├── requests/           # リクエストスペック（API テスト）
│   └── users_spec.rb
├── services/           # サービスクラスのテスト
│   └── github_service_spec.rb
├── support/            # ヘルパーや共通設定
│   └── test_prof.rb
├── rails_helper.rb
└── spec_helper.rb
```
