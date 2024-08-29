---
draft: false
emoji: 💎
title: Ruby on Railsに関するメモを追加していく記事
slug: ruby-on-rails-notes
published_at: 2023-11-03 23:31:16
modified_at: 2024-08-30 00:31:45
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

## Query Object Pattern

::link-card[https://techracho.bpsinc.jp/hachi8833/2022_03_24/47287]

## YARDのvoid

::link-card[https://stackoverflow.com/questions/25715454/how-to-yard-document-a-method-that-returns-nothing]

## Steep

::link-card[https://mogura.dev/articles/vscode-and-steep/]
::link-card[https://zenn.dev/yukyan/articles/4c62efd21ff4b2]
::link-card[https://tech.studyplus.co.jp/entry/2023/02/03/110000]
::link-card[https://zenn.dev/katsumanarisawa/articles/833b06ac80e1dc]

## Active Recordのバッチ処理の書き方

```ruby:例）User.nameの末尾に「!」をまとめて追加する
User.find_in_batches(batch_size: 500) do |users|
  users.each do |user|
    user.name = user.name + '!'
    user.record_timestamps = false # updated_atを変更しないようにする
    user.save

    p user.name
  end
end
```
