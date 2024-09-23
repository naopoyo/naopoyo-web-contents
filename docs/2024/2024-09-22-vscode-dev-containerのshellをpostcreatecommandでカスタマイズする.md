---
draft: false
emoji: 😉
title: VSCode Dev ContainerのzshをpostCreateCommandでカスタマイズする
slug: customize-zsh-of-vscode-dev-container-with-post-create-command
published_at: 2024-09-22 14:26:27
modified_at: 2024-09-22 14:26:27
tags:
  - Docker
  - VS Code
  - zsh
preview: null
---

## 概要

VSCode Dev ContainerのzshをPreztoとpecoをインストールしてカスタマイズします。カスタマイズの処理は `postCreateCommand` でスクリプトを実行して行います。

## Dev Containerの設定

```json:.devcontainer/devcontainer.json
{
  // ...
  "postCreateCommand": "zsh .devcontainer/post-create-command.sh",
  // ...
}
```

## `postCreateCommand` で実行するスクリプト

```sh:.devcontainer/post-create-command.sh
#!/bin/zsh

echo "Setup start"

ZPREZTO_DIR="${ZDOTDIR:-$HOME}/.zprezto"

# Install prezto
if [ ! -d "$ZPREZTO_DIR" ]; then
  echo "Install prezto"

  git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"

  setopt EXTENDED_GLOB
  for rcfile in "${ZDOTDIR:-$HOME}"/.zprezto/runcoms/^README.md(.N); do
    ln -s "$rcfile" "${ZDOTDIR:-$HOME}/.${rcfile:t}"
  done

  # .zshrcにpecoの設定を追加
  ZSHRC_PATH="${ZDOTDIR:-$HOME}/.zshrc"
  SEARCH_STRING="# Customize to your needs..."
  ZSHRC_SETTINGS_LINES=$(cat << "EOF"
\
\
# peco-history-selection\
function peco-history-selection() {\
    BUFFER=`history -n 1 | tac | awk '!a[$0]++' | peco`\
    CURSOR=$#BUFFER\
    zle reset-prompt\
}\
zle -N peco-history-selection\
bindkey '^R' peco-history-selection
EOF
  )
  sed -i "/${SEARCH_STRING}/a ${ZSHRC_SETTINGS_LINES}" "$ZSHRC_PATH"

  # .zpreztorcにgitの設定を追加
  ZPREZTORC_PATH="${ZDOTDIR:-$HOME}/.zpreztorc"
  ZPREZTORC_SEARCH_STRING="^zstyle ':prezto:load' pmodule"
  ZPREZTORC_SETTINGS_LINES=$(cat << "EOF"
\
  'git' \\
EOF
  )
  sed -i "/${ZPREZTORC_SEARCH_STRING}/a ${ZPREZTORC_SETTINGS_LINES}" "$ZPREZTORC_PATH"

  # .zpreztorcのテーマ設定を変更
  sed -i "s/^zstyle ':prezto:module:prompt' theme '.*'/zstyle ':prezto:module:prompt' theme 'cloud'/" "$ZPREZTORC_PATH"

  ZSHRC_PATH="${ZDOTDIR:-$HOME}/.zshrc"
fi

PECO_PATH=/usr/local/bin/peco

# Install peco
if [ ! -f "$PECO_PATH" ]; then
  echo "Install peco"

  wget https://github.com/peco/peco/releases/download/v0.5.10/peco_linux_amd64.tar.gz
  tar zxvf peco_linux_amd64.tar.gz
  cp -p peco_linux_amd64/peco /usr/local/bin

  rm peco_linux_amd64.tar.gz
  rm -rf peco_linux_amd64
fi

echo "Setup end"

exit 0
```
