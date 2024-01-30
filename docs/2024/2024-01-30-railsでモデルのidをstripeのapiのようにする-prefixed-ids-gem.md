---
draft: false
emoji: 🌽
title: RailsでモデルのIDをStripeのAPIのようにする Prefixed IDs gem
slug: prefixed-ids-gem
published_at: 2024-01-30 22:49:35
modified_at: 2024-01-30 22:49:35
tags:
    - Rails
    - Ruby
preview: null
---

## gem

::link-card[https://github.com/excid3/prefixed_ids]

## 概要

[StripeのAPI](https://stripe.com/docs/api/customers/object)では各リソースのIDが `cus_12345abcd` のように `プレフィックス+ランダムな文字列` になっています。RailsのモデルのIDをこのような形式で扱うための便利なgemです。

DBのAUTO_INCREMENTな値をIDとしてそのまま使いたくない。でも、UUIDみたいなカラムを追加するのも。。。みたいなときにありがたいですね。GraphQLの場合は、それぞれのリソース毎にグローバルでユニークなIDをつけた方が良いので、そんな時にも使えます。

## 使い方

1. Gemfileに以下を追加して `bundle install` を実行します。

    ```ruby:Gemfile
    gem 'prefixed_ids'
    ```

2. Prefixed IDsのランダムな文字列を生成するための[salt](https://github.com/excid3/prefixed_ids?tab=readme-ov-file#salt)を設定します。以下のようにすることで、環境変数で設定できるようになります。`bundle exec rails secret`などで生成した文字列を設定しておきましょう。

    ```ruby:config/initializers/prefixed_ids.rb
    PrefixedIds.salt = ENV.fetch('PREFIXED_IDS_SALT')
    ```

3. Prefixed IDsを有効にしたいモデルに以下のように `has_prefix_id :user` を追加します。`:user` の部分はプレフィックスになるので `u_abc123` のようにしたい場合は `:u` にしましょう。

    ```ruby:app/models/user.rb
    class User < ApplicationRecord
        has_prefix_id :user
    end
    ```

4. 以上で簡単な設定は終わりです。以下のようにしてレコードを取得できるようになります。

    ```ruby:レコードを取得する
    user = User.find(1)
    puts user.id # 1
    puts user.prefix_id # user_mX6g41alvDZ9Zu6Ro7AOejE3

    user2 = User.find('user_mX6g41alvDZ9Zu6Ro7AOejE3')
    puts user == user2 # true
    
    user3 = PrefixedIds.find('user_mX6g41alvDZ9Zu6Ro7AOejE3')
    puts user == user3 # true
    ```

## 高度な設定: Model.findメソッドで指定できるIDをどちらか一方にできる

デフォルトでは `find` で通常のIDとPrefixed IDのどちらを指定してもレコードが取得できますが、どちらか一方に制限することができます。

### 通常のIDのみにしたい場合

```ruby:Prefixed IDのみにしたい場合
class User < ApplicationRecord
  has_prefix_id :user, override_find: false, override_param: false
end

# OK
User.find(1)

# Error
User.find('user_mX6g41alvDZ9Zu6Ro7AOejE3')
# Couldn't find User with 'id'=user_mX6g41alvDZ9Zu6Ro7AOejE3
```

### Prefixed IDのみにしたい場合

```ruby:Prefixed IDのみにしたい場合
class User < ApplicationRecord
  has_prefix_id :user, override_find: true, override_param: true, fallback: false
end

# OK
User.find('user_mX6g41alvDZ9Zu6Ro7AOejE3')

# Error
User.find(1)
# 1 is not a valid prefix_id
```
