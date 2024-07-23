---
draft: true
emoji: 🛸
title: PreztoでZshをカスタマイズする
slug: customizing-zsh-with-prezto
published_at: 2024-07-24 00:30:06
modified_at: 2024-07-24 00:30:06
tags:
  - zsh
preview: null
type: default
---

## この記事について

::link-card[https://github.com/sorin-ionescu/prezto]

Zshの設定フレームワークであるPreztoについてまとめています。

## インストール

まず、Gitリポジトリをクローンします。

```sh:Terminal
git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"
```

次にzshの構成ファイルの作成を行います。

```sh:Terminal
setopt EXTENDED_GLOB
for rcfile in "${ZDOTDIR:-$HOME}"/.zprezto/runcoms/^README.md(.N); do
  ln -s "$rcfile" "${ZDOTDIR:-$HOME}/.${rcfile:t}"
done
```

上記のコマンドを実行するとホームディレクトリに以下のシンボリックリンクが作成されます。

- .zlogin -> ~/.zprezto/runcoms/zlogin
- .zlogout -> ~/.zprezto/runcoms/zlogout
- .zpreztorc -> ~/.zprezto/runcoms/zpreztorc
- .zprofile -> ~/.zprezto/runcoms/zprofile
- .zshenv -> ~/.zprezto/runcoms/zshenv
- .zshrc -> ~/.zprezto/runcoms/zshrc

## アップデート

```sh:Terminal
cd $ZPREZTODIR
git pull
git submodule sync --recursive
git submodule update --init --recursive
```

zshの構成ファイルを編集していない場合は公式のREADME.mdに記載されている上記のコマンドで更新できます。しかし、`.zshrc`をカスタマイズしている場合などは以下のようなエラーが出ます。

```text
error: Your local changes to the following files would be overwritten by merge:
    runcoms/zshrc
Please commit your changes or stash them before you merge.
Aborting
```

この場合は、以下のように `git stash` をして変更を一時的に退避させる必要があります。

```sh:Terminal
cd $ZPREZTODIR
git stash # [!code highlight]
git pull
git stash pop # [!code highlight]
git submodule sync --recursive
git submodule update --init --recursive
```

## テーマ関連コマンド早見表

| コマンド            | 説明                             |
| ------------------- | -------------------------------- |
| `prompt -c`         | 適用しているテーマを確認         |
| `prompt -l`         | 使用可能なテーマ一覧を表示する   |
| `prompt -p`         | テーマのプレビュー一覧を表示する |
| `prompt -s <theme>` | テーマを指定したものに設定する   |

## Gitプライグインを追加する

`.zpreztorc` を開いて以下のように修正する。

```sh:.zpreztorc
# Set the Prezto modules to load (browse modules).
# The order matters.
zstyle ':prezto:load' pmodule \
  'git' \ # [!code ++]
  'environment' \
  # ... 中略 ... #
  'completion' \
  'prompt'
```
