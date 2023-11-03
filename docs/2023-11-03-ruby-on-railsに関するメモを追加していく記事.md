---
draft: false
emoji: 💎
title: Ruby on Railsに関するメモを追加していく記事
slug: ruby-on-rails-notes
published_at: 2023-11-03 23:31:16
modified_at: 2023-11-03 23:31:16
tags:
    - Ruby
    - Rails
preview: null
---

## ruby-lsp を VS Code で使う場合は Gemfile でインストール

```ruby:Gemfile
gem 'ruby-lsp'
```

```sh:Terminal
bundle install
```

`gem install ruby-lsp` のようにグローバルにインストールしても動かない。
