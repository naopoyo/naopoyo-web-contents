---
draft: false
emoji: 💎
title: RailsのプロジェクトをDockerコンテナ上に作成する
slug: create-a-rails-project-on-a-docker-container
published_at: 2024-09-21 10:35:50
modified_at: 2024-09-21 10:35:50
tags:
  - Ruby
  - Rails
preview: null
---

## Dockerfile作成

```dockerfile:docker/server/Dockerfile
FROM ruby:3.2.4-slim
WORKDIR /tmp
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libmysqld-dev \
    wget \
    git \
    vim \
    nano \
    zsh \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* \
 && gem install bundler
```

```yaml:docker/docker-compose.yaml
version: "3"

name: "project"

volumes:
  db_data:
  redis_data:
  server_vendor:
  server_workspace_root:

services:
  server_workspace:
    build: server
    command: sleep infinity
    environment:
      BUNDLE_APP_CONFIG: /var/workspace/server/.bundle
    working_dir: /var/workspace/server
    volumes:
      - ../:/var/workspace/:cached
      - ~/.ssh/:/root/.ssh/
      - server_vendor:/var/workspace/server/vendor
      - server_workspace_root:/root/
    ports:
      - 3000:3000
  db:
    image: mysql:8.0
    volumes:
      - db_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - 3306:3306
  redis:
    image: "redis:7"
    volumes:
      - "redis_data:/data"
    ports:
      - "6379:6379"
```

## Devcontainerの設定

```json:server/.devcontainer/devcontainer.json
{
  "name": "project-server",
  "dockerComposeFile": "../../docker/docker-compose.yml",
  "service": "server_workspace",
  "workspaceFolder": "/var/workspace/server",
  "customizations": {
    "vscode": {
      "extensions": [
        "castwide.solargraph",
        "donjayamanne.githistory",
        "EditorConfig.EditorConfig",
        "esbenp.prettier-vscode",
        "GitHub.vscode-pull-request-github",
        "KoichiSasada.vscode-rdbg",
        "MateuszDrewniak.ruby-test-runner",
        "Shopify.ruby-lsp"
      ]
    }
  },
  "shutdownAction": "none"
}
```

## Railsプロジェクト作成

Gemfileを作成するために次のコマンドを実行します。

```sh:Terminal
bundle init
```

## Gemfileを修正

Gemfileの次の記述のコメントを外して有効にします。

```ruby:Gemfile
gem 'rails'
```

## rails gemをインストール

```sh:Terminal
bundle install --path vendor/bundle --jobs=4
```

## rails new

```sh:Terminal
bundle exec rails new . -B --api -d mysql --skip-test
```

### rails new のオプション

| オプション    | 説明                      |
| ------------- | ------------------------- |
| `--api`       | APIモードでインストール   |
| `--skip-test` | minitestのスキップ        |
| `-B`          | bundle install のスキップ |
| `-d mysql`    | mysql を使用する          |

## .gitignore修正

.gitignore に以下を追記する。

```text:.gitignore
vendor/bundle
```

## DBセットアップ

```sh:Terminal
bundle exec rails db:setup
```
