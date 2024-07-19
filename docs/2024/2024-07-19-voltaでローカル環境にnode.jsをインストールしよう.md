---
draft: false
emoji: ⚡️
title: Voltaでローカル環境にNode.jsをインストールしよう(macOS)
slug: set-up-node-js-locally-with-volta
published_at: 2024-07-19 23:16:34
modified_at: 2024-07-19 23:16:34
tags:
  - Node.js
  - Volta
preview: null
type: default
---

## はじめに

::link-card[https://volta.sh/]

macOSでJavaScript Tool ManagerのVoltaを使ってNode.jsをインストールする手順を解説します。

また、Node.jsのパッケージマネージャーはpnpmを使うように設定します。パッケージマネージャーの管理はcorepackを使うようにします。

この記事の概要:

1. Voltaのインストール
2. Node.jsのインストール
3. corepackでpnpmを有効化

## Voltaインストール

```sh:Terminal
curl https://get.volta.sh | bash
```

上記のコマンドでインストールできます。`~/.volta` が作成され、`~/.zshrc` などに以下の記述が追加されます。

```sh:~/.zshrc
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
```

.zshrc以外のファイルの場合は以下のものがあります:

- .bashrc
- .bash_profile
- config.fish
- .profile

`volta -v` でバージョンが表示されたらインストール成功です。

## Node.jsインストール

```sh:Terminal
volta install node@20 # Node.jsのインストール
node --version # Node.jsのバージョンが表示されたらインストール成功です
volta list node # voltaでインストールしたNode.jsの一覧を表示できます
```

上記のコマンドを順に実行してNode.jsをインストールします。今回はv20をインストールしています。

インストール可能なバージョン一覧の確認コマンドは無いようなので[Node.js Releases](https://nodejs.org/en/about/previous-releases)のページなどで確認しましょう。

## corepackでpnpmを有効化

```sh:Terminal
volta install corepack # corepackをインストールします
corepack enable pnpm # pnpmを有効化します
pnpm -v # pnpmのバージョンが表示されたら有効化できています
```

上記のコマンドを順に実行して、pnpmのバージョンが表示されたら全て完了です。

ここまで試して不要だと感じた場合は、引き続きアンインストールの手順を記載しているので削除しましょう。

## Voltaのアンインストール方法

```sh:Terminal
rm -rf ~/.volta
```

上記のコマンドで `~/.volta` を削除してします。そして、インストール時に `~/.zshrc` などに追加された記述を削除します。
