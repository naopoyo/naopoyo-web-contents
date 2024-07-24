---
draft: false
emoji: 🛸
title: PreztoでZshをカスタマイズする
slug: customizing-zsh-with-prezto
published_at: 2024-07-24 00:30:06
modified_at: 2024-07-24 21:45:14
tags:
  - zsh
preview: null
type: default
---

## この記事について

Zshの設定フレームワークであるPreztoについてまとめています。

::link-card[https://github.com/sorin-ionescu/prezto]

## Preztoのインストール

まず、Gitリポジトリをクローンします。

```sh:Terminal
git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"
```

次にzshの構成ファイルの作成を行います。

> [!CAUTION]
> 後述の「構成ファイル作成コマンド」を実行する前に、ホームディレクトリに存在する以下のファイルのバックアップを作成しておくことをおすすめします。
>
> - .zlogin
> - .zlogout
> - .zprofile
> - .zshenv
> - .zshrc
>
> 下記の「バックアップ用コマンドの例」ではホームディレクトリに `.zsh-backup`というディレクトリを作成して上記のファイルを全てコピーします。
>
> ```sh:バックアップ用コマンドの例
> mkdir -p ~/.zsh-backup && cp ~/.zlogin ~/.zlogout ~/.zprofile ~/.zshenv ~/.zshrc ~/.zsh-backup/
> ```

バックアップが完了したら「構成ファイル作成コマンド」を実行します。

```sh:構成ファイル作成コマンド
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

## Preztoのアップデート

zshの構成ファイルを編集していない場合は公式のREADME.mdに記載されている次のコマンドで更新できます。

```sh:Terminal
cd $ZPREZTODIR
git pull
git submodule sync --recursive
git submodule update --init --recursive
```

しかし、`.zshrc`をカスタマイズしている場合などは `git pull` の時点で以下のようなエラーが出ます。

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

| コマンド            | 説明                                   |
| ------------------- | -------------------------------------- |
| `prompt -c`         | 適用しているテーマを確認               |
| `prompt -l`         | 使用可能なテーマ一覧を表示する         |
| `prompt -p`         | テーマのプレビュー一覧を表示する       |
| `prompt -s <theme>` | 一時的にテーマを指定したものに設定する |

## Gitプライグインを追加する

`.zpreztorc` を開いて以下のように修正する。

```text:.zpreztorc
# Set the Prezto modules to load (browse modules).
# The order matters.
zstyle ':prezto:load' pmodule \
  'git' \ // [!code ++]
  'environment' \
  # ... 中略 ... #
  'completion' \
  'prompt'
```

## Preztoのアンインストール

後述の「アンインストールコマンド」でアンインストールできます。

> [!CAUTION]
> 「アンインストールコマンド」を実行すると以下のzsh構成ファイルも削除されてしまいます。カスタマイズしている場合はバックアップを取っておくことをおすすめします。
>
> - .zshrc
> - .zlogin
> - .zlogout
> - .zprofile
> - .zshenv
>
> 本記事の手順でPreztoをインストールした場合、ホームディレクトリにあるこれらのファイルは `~/.zprezto/runcoms` に存在するファイルへのシンボリックリンクになっています。アンインストールする場合 `~/.zprezto` を削除するのでカスタマイズしている場合は、事前にバックアップしておくと良いです。
>
> カスタマイズしていない場合はPreztoのGitHubリポジトリなどから復元可能です。

「アンインストール前のバックアップコマンド」を実行すると、ホームディレクトリに `.zsh-uninstall-backup` を作成してzsh構成ファイルをコピーします。

```sh:アンインストール前のバックアップコマンド
mkdir -p ~/.zsh-uninstall-backup && cp ~/.zlogin ~/.zlogout ~/.zprofile ~/.zshenv ~/.zshrc ~/.zsh-uninstall-backup/
```

バックアップが完了したら、以下の「アンインストールコマンド」でアンインストールします。

```sh:アンインストールコマンド
rm -rf ~/.zprezto ~/.zshrc ~/.zlogin ~/.zlogout ~/.zpreztorc ~/.zprofile ~/.zshenv
```

### Preztoのアンインストール後の.zshrcの修正

アンインストール後の `~/.zshrc` に以下の記述がある場合は不要なので削除します。

```sh:.zshrc
# Source Prezto.
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi
```
