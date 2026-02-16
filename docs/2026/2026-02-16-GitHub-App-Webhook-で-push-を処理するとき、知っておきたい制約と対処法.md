---
draft: true
emoji: 🎣
title: GitHub App Webhook で push を処理するとき、知っておきたい制約と対処法
slug: github-app-webhook-push-processing-constraints-and-solutions
published_at: 2026-02-16 18:44:14
modified_at: 2026-02-16 18:44:14
tags:
  - GitHub
  - Ruby
preview: null
---

## はじめに

GitHub App の push イベントの Webhook は便利ですが、ペイロードにはいくつかの制約があります。小規模な運用では気づきにくく、本番で大量のファイルが push されたときに初めて問題が顕在化する、厄介なタイプの制約です。

この記事では、GitHub App の push Webhook を使ったファイル同期処理で遭遇しやすい制約と、その対処法をコード例とともに紹介します。

### この記事のポイント

- push Webhook の `commits` 配列は最大 20 件で、超過分はサイレントに切り捨てられる
- 各コミットのファイルリスト（`added` / `modified` / `removed`）も大量変更時に切り詰められる
- GitHub Contents API には 1 ファイル 1MB の制限と、1 時間あたり 5,000 リクエストのレートリミットがある
- これらの制約を意識しないと、ファイルの欠落がサイレントに発生する
- 対処法として「コミットのマージ」「切り詰め検出とフォールバック」「API コールの最適化」が有効

## 制約 1: commits 配列の 20 件制限

push Webhook のペイロードには `commits` 配列が含まれますが、これは最大 20 件までしか入りません。

たとえば、ローカルで 50 コミットを溜めてから `git push` した場合、Webhook に届くのは直近の 20 件だけです。ペイロードには実際のコミット数を示す `size` フィールドがあるので、切り詰めが起きたかどうかは判定できます。

しかし、切り詰めが起きたこと自体はエラーにならず、Webhook は正常に配信されます。気づかずに 20 件だけ処理してしまうと、残り 30 件分のファイル変更が反映されません。

```ruby
class PushWebhookHandler
  def process(payload)
    if payload[:size] > payload[:commits].length
      # commits が切り詰められている
      # Webhook だけでは全変更を把握できない
      logger.warn("commits truncated: #{payload[:size]} commits, only #{payload[:commits].length} received")
      trigger_full_sync(payload)
      return
    end

    process_commits(payload[:commits])
  end
end
```

`size` と `commits.length` を比較するだけで検出できます。検出したらフルスキャン（後述）に切り替えるのが安全です。

## 制約 2: ファイルリストの切り詰め

各コミットには `added`、`modified`、`removed` というファイルパスの配列が含まれます。しかし、1 つのコミットで数百ファイルを変更した場合、この配列も切り詰められることがあります。

厄介なのは、こちらには `size` のような明示的なフラグがないことです。ファイルリストが不完全かどうかを Webhook ペイロードだけで判断するのは難しいため、別のアプローチが必要になります。

```ruby
class PushWebhookHandler
  MAX_FILES_THRESHOLD = 300

  def process_commits(commits)
    total_files = commits.sum { |c| c[:added].length + c[:modified].length + c[:removed].length }

    if total_files >= MAX_FILES_THRESHOLD
      # ファイル数が多すぎる場合、切り詰めの可能性がある
      # Compare API で正確な差分を取得する
      trigger_full_sync(payload)
      return
    end

    sync_files(commits)
  end
end
```

閾値を設けて、それを超えたらフルスキャンに切り替える方法が現実的です。閾値の値は GitHub の内部実装に依存するため、余裕を持たせた設定にしておくのが良いでしょう。

## 制約 3: Contents API の 1MB 制限

Webhook で変更されたファイルのパスがわかったら、次は GitHub API でファイルの中身を取得します。ここで使うのが Contents API（`GET /repos/{owner}/{repo}/contents/{path}`）ですが、このエンドポイントは 1MB を超えるファイルを取得できません。

```ruby
class ContentFetcher
  def fetch(path:, ref:)
    client.contents(repo, path: path, ref: ref)
  rescue Octokit::Forbidden => e
    if e.message.include?("too large")
      # 1MB 超のファイルは Blob API で取得する
      fetch_via_blob(path: path, ref: ref)
    else
      raise
    end
  end

  private

  def fetch_via_blob(path:, ref:)
    # Tree API でファイルの SHA を取得
    tree = client.tree(repo, ref, recursive: true)
    item = tree[:tree].find { |t| t[:path] == path }
    return nil unless item

    # Blob API は 100MB まで対応
    blob = client.blob(repo, item[:sha])
    { path: path, content: blob[:content], sha: item[:sha] }
  end
end
```

1MB を超えるファイルが必要な場合は、Blob API（`GET /repos/{owner}/{repo}/git/blobs/{sha}`）を使います。こちらは 100MB まで対応しています。ただし、ドキュメント同期のようなユースケースでは、1MB を超えるファイルはそもそもスキップしてしまうのも選択肢です。

## 制約 4: API レートリミット

GitHub App の Installation Token には、1 時間あたり 5,000 リクエストのレートリミットがあります（Organization の規模によって上限が引き上げられる場合もあります）。

push のたびにファイル数ぶんの API コールが発生する設計だと、頻繁に push されるリポジトリではすぐにレートリミットに到達します。

ここで効くのが、複数コミットの変更をマージする手法です。

```ruby
class CommitMerger
  # 全コミットの変更を「最終的な差分」に集約する
  def merge(commits)
    file_states = {}

    commits.each do |commit|
      commit[:added].each do |path|
        state = file_states[path] ||= { existed_before: false }
        state[:exists_after] = true
        state[:timestamp] = commit[:timestamp]
      end

      commit[:modified].each do |path|
        state = file_states[path] ||= { existed_before: true }
        state[:exists_after] = true
        state[:timestamp] = commit[:timestamp]
      end

      commit[:removed].each do |path|
        state = file_states[path] ||= { existed_before: true }
        state[:exists_after] = false
      end
    end

    file_states
  end
end
```

このマージ処理を通すと、5 コミットで同じファイルが毎回変更されていても、API コールは 1 回で済みます。コミット 1 で追加してコミット 3 で削除されたファイルは no-op として完全にスキップされます。

マージ結果は 4 つの状態に分類されます。

| push 前の状態  | push 後の状態 | 分類     | 処理                    |
| -------------- | ------------- | -------- | ----------------------- |
| 存在しなかった | 存在する      | added    | HEAD から取得して保存   |
| 存在した       | 存在する      | modified | HEAD から取得して上書き |
| 存在した       | 存在しない    | removed  | 削除                    |
| 存在しなかった | 存在しない    | no-op    | 何もしない              |

```ruby
class FileSyncer
  def sync(file_states, head_ref:, before_ref:)
    added    = file_states.select { |_, s| !s[:existed_before] && s[:exists_after] }
    modified = file_states.select { |_, s| s[:existed_before] && s[:exists_after] }
    removed  = file_states.select { |_, s| s[:existed_before] && !s[:exists_after] }
    # existed_before=false, exists_after=false は自動的に除外される

    # added と modified は HEAD から取得（同じ ref なのでまとめられる）
    paths_to_fetch = (added.keys + modified.keys)
    contents = fetcher.fetch_multiple(paths: paths_to_fetch, ref: head_ref)

    # removed は削除処理のみ（内容の取得は不要）
    removed.each_key { |path| delete_file(path) }

    persist(contents, file_states)
  end
end
```

注目すべきは、added と modified がどちらも HEAD の ref から取得できる点です。中間コミットの ref を使う必要がないため、ref の管理もシンプルになります。

## 制約 5: Webhook 配信のタイムアウト

GitHub は Webhook のレスポンスを 10 秒以内に期待しています。10 秒を超えるとタイムアウトとなり、配信失敗として記録されます（リトライはされます）。

大量のファイルを同期的に処理するとタイムアウトしてしまうため、Webhook の受信は即座にレスポンスを返し、実際の処理はバックグラウンドジョブに委譲するのが鉄則です。

```ruby
class WebhooksController < ApplicationController
  def create
    # Webhook の受信は即座に 200 を返す
    WebhookProcessJob.perform_async(request.body.read, request.headers)
    head :ok
  end
end

class WebhookProcessJob
  include Sidekiq::Job
  sidekiq_options retry: 3

  def perform(payload_json, headers)
    payload = JSON.parse(payload_json, symbolize_names: true)
    PushWebhookHandler.new.process(payload)
  end
end
```

バックグラウンドジョブにした場合でも、同じリポジトリへの push が短時間に連続すると処理が競合する可能性があります。Advisory Lock のような排他制御を入れておくと安全です。

```ruby
class WebhookProcessJob
  LOCK_TIMEOUT = 300 # 5 分

  def perform(payload_json, headers)
    payload = JSON.parse(payload_json, symbolize_names: true)
    repo = Repository.find_by(full_name: payload[:repository][:full_name])

    lock_acquired = repo.with_advisory_lock("webhook_push_#{repo.id}", timeout_seconds: LOCK_TIMEOUT) do
      PushWebhookHandler.new.process(payload)
    end

    raise "Lock timeout for repo #{repo.id}" unless lock_acquired
  end
end
```

## フルスキャンへのフォールバック

ここまで見てきた制約をまとめると、「Webhook のペイロードだけでは全ての変更を把握できないケースがある」ということになります。

このような場合の保険として、フルスキャン（リポジトリ全体の同期）へのフォールバック機構を用意しておくと安心です。

```ruby
class PushWebhookHandler
  def process(payload)
    # 切り詰め検出
    return trigger_full_sync(payload) if commits_truncated?(payload)

    # コミットのマージ
    file_states = CommitMerger.new.merge(payload[:commits])

    # ファイル数が多すぎる場合もフルスキャンに切り替え
    return trigger_full_sync(payload) if file_states.size > SYNC_THRESHOLD

    # 通常処理
    FileSyncer.new.sync(file_states, head_ref: payload[:after], before_ref: payload[:before])
  end

  private

  def commits_truncated?(payload)
    payload[:size] > payload[:commits].length
  end

  def trigger_full_sync(payload)
    FullSyncJob.perform_async(payload[:repository][:full_name], payload[:after])
    logger.info("Triggered full sync for #{payload[:repository][:full_name]}")
  end
end
```

フルスキャンは Tree API（`GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1`）を使えば、1 回の API コールでリポジトリ全体のファイル一覧を取得できます。ファイルの中身は個別に取得する必要がありますが、少なくとも「何が存在するか」の全体像は把握できます。

## まとめ

GitHub App の push Webhook は便利ですが、ペイロードの制約を理解していないとデータの欠落に気づけません。対処のポイントを整理すると、こうなります。

まず、ペイロードの切り詰めを検出する仕組みを入れておくこと。`size` フィールドとの比較やファイル数の閾値チェックは、コストの割に効果が大きいです。

次に、複数コミットの変更をマージして API コールを減らすこと。中間状態を個別に処理する必要はなく、最終的な差分だけを見れば十分です。

最後に、Webhook だけで完結しようとしないこと。フルスキャンへのフォールバックを用意しておけば、どんな push が来ても最終的には正しい状態に収束します。

push Webhook は差分処理の最適化手段であって、データの信頼性を保証する唯一の手段ではない、という割り切りが設計をシンプルにしてくれます。
