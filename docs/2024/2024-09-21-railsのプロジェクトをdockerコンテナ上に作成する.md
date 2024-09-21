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

## ディレクトリ構成

```tree:ディレクトリ構成
Project Root
├── Taskfile.yaml
├── docker
│   ├── docker-compose.yml
│   └── server
│       └── Dockerfile
└── server
    └── .devcontainer
        └── devcontainer.json
```

## Taskfile.yml作成

```yaml:Taskfile.yml
version: '3'

tasks:
  'dev:build':
    desc: 開発環境コンテナビルド
    cmds:
      - docker-compose -f docker/docker-compose.yml up -d --build
  'dev:start':
    desc: 開発環境コンテナ起動
    cmds:
      - docker-compose -f docker/docker-compose.yml up -d
  'dev:stop':
    desc: 開発環境コンテナ停止
    cmds:
      - docker-compose -f docker/docker-compose.yml down
```

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
  server_bundle:
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
      - server_bundle:/usr/local/bundle
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
bundle config set path 'vendor/bundle'
bundle install
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

## Dotenvを追加

Gemfileの次の記述を追加して `bundle install` を実行します。

```ruby:Gemfile
group :development, :test do
  # ...
  gem "dotenv-rails"
end
```

## DBセットアップ

```sh:Terminal
bundle exec rails db:setup
bundle exec rails db:migrate
```

## 開発サーバー起動

```sh:Teminal
bundle exec rails s -b 0.0.0.0
```
