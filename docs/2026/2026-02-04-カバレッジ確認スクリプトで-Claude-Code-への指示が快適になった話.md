---
draft: false
emoji: 🎯
title: カバレッジ確認スクリプトで Claude Code への指示が快適になった話
slug: coverage-check-script-makes-claude-code-instructions-comfortable
published_at: 2026-02-04 23:18:50
modified_at: 2026-02-04 23:18:50
tags:
  - Claude Code
  - Rails
  - Ruby
preview: null
---

## この記事のポイント

- 「services 以下のカバレッジが低いファイルのテストを改善して」という指示に Claude Code が時間をかけていた
- SimpleCov が出力する JSON を直接読む Rake タスクを作ったら即座に対象ファイルを特定できるようになった
- AI アシスタントの作業効率は、人間がツールを整備することで大きく改善できる

## 背景

最近、Claude Code に「services 以下でカバレッジが低いファイルのテストを改善して」と指示することが増えた。

こう指示すると、Claude Code はまず対象ファイルを探し始める。SimpleCov が生成した HTML を解析したり、RSpec を再実行したり。ちなみに HTML 解析のときは coverage/index.html を Read ツールで開いて、正規表現でカバレッジ率を抽出しようとしていた。律儀だなあ、と思いながら眺めてしまう。

ただ、これが意外と時間がかかる。本題のテスト改善に入る前に、調査だけで数分待たされることもあった。「もっと速くできないかな」と思い始めて、SimpleCov の出力を調べてみることにした。

## SimpleCov は JSON を吐いている

coverage ディレクトリを覗いてみたら、.resultset.json というファイルがあった。開いてみると、各ファイルの行ごとの実行回数がそのまま記録されている。

```json
{
  "RSpec": {
    "coverage": {
      "/path/to/app/services/post_publisher.rb": {
        "lines": [null, null, 1, 1, 0, null, 5, ...]
      }
    }
  }
}
```

null は実行対象外（コメントや空行）、0 がカバーされていない行、1 以上がカバーされている行。これだけわかれば、カバレッジ率は計算できる。HTML を解析するより、こっちを読んだほうが早い。

というわけで、この JSON を読む Rake タスクを作った。

### Rake タスクのコード

<details>

<summary>Rake タスクのコードを見る</summary>

```ruby:lib/tasks/coverage.rake
namespace :coverage do
  desc '特定ファイルのカバレッジを表示（部分一致検索）'
  task :file, [:path] => :environment do |_t, args|
    require 'json'

    resultset_path = Rails.root.join('coverage/.resultset.json')

    unless File.exist?(resultset_path)
      puts 'Error: coverage/.resultset.json が見つかりません'
      puts 'bundle exec rspec を実行してカバレッジを生成してください'
      exit 1
    end

    resultset = JSON.parse(File.read(resultset_path))
    coverage = resultset.dig('RSpec', 'coverage')

    if coverage.nil?
      puts 'Error: カバレッジデータが見つかりません'
      exit 1
    end

    search_path = args[:path]
    if search_path.blank?
      puts 'Usage: bundle exec rake coverage:file[ファイルパスの一部]'
      puts '例: bundle exec rake coverage:file[commit]'
      exit 1
    end

    matches = coverage.select { |k, _| k.include?(search_path) }

    if matches.empty?
      puts "#{search_path} に一致するファイルが見つかりません"
      exit 0
    end

    matches.each do |file, data|
      lines = data['lines']
      relevant = lines.compact
      covered = relevant.count(&:positive?)
      pct = (covered.to_f / relevant.size * 100).round(2)
      relative_path = file.sub(Rails.root.join.to_s, '')

      puts "#{relative_path}: #{pct}% (#{covered}/#{relevant.size})"
    end
  end

  desc '全ファイルのカバレッジサマリーを表示'
  task summary: :environment do
    require 'json'

    resultset_path = Rails.root.join('coverage/.resultset.json')

    unless File.exist?(resultset_path)
      puts 'Error: coverage/.resultset.json が見つかりません'
      exit 1
    end

    resultset = JSON.parse(File.read(resultset_path))
    coverage = resultset.dig('RSpec', 'coverage')

    total_relevant = 0
    total_covered = 0

    coverage.each_value do |data|
      lines = data['lines']
      relevant = lines.compact
      total_relevant += relevant.size
      total_covered += relevant.count(&:positive?)
    end

    pct = (total_covered.to_f / total_relevant * 100).round(2)
    puts "全体カバレッジ: #{pct}% (#{total_covered}/#{total_relevant})"
  end

  desc 'カバレッジが100%未満のファイル一覧を表示'
  task incomplete: :environment do
    require 'json'

    resultset_path = Rails.root.join('coverage/.resultset.json')

    unless File.exist?(resultset_path)
      puts 'Error: coverage/.resultset.json が見つかりません'
      exit 1
    end

    resultset = JSON.parse(File.read(resultset_path))
    coverage = resultset.dig('RSpec', 'coverage')

    incomplete_files = []

    coverage.each do |file, data|
      lines = data['lines']
      relevant = lines.compact
      next if relevant.empty?

      covered = relevant.count(&:positive?)
      pct = (covered.to_f / relevant.size * 100).round(2)
      next if pct >= 100.0

      relative_path = file.sub(Rails.root.join.to_s, '')
      incomplete_files << { path: relative_path, pct: pct, covered: covered, total: relevant.size }
    end

    if incomplete_files.empty?
      puts '全てのファイルが100%カバーされています'
      exit 0
    end

    incomplete_files.sort_by! { |f| f[:pct] }

    incomplete_files.each do |f|
      puts "#{f[:path]}: #{f[:pct]}% (#{f[:covered]}/#{f[:total]})"
    end

    puts "\n合計: #{incomplete_files.size} ファイル"
  end
end
```

</details>

## 一瞬で対象ファイルがわかる

ディレクトリやファイル名の一部を指定すると、該当するファイルのカバレッジが一覧表示される。

```bash
$ bundle exec rake coverage:file[services]
app/services/post_publisher.rb: 95.0% (19/20)
app/services/notification_sender.rb: 72.5% (29/40)
app/services/comment_moderator.rb: 100.0% (35/35)
```

カバレッジが 100% 未満のファイルだけを抽出するタスクも作った。カバレッジ率の低い順に並ぶので、どこから手をつけるか一目でわかる。

```bash
$ bundle exec rake coverage:incomplete
app/services/notification_sender.rb: 72.5% (29/40)
app/models/comment.rb: 85.0% (17/20)
app/services/post_publisher.rb: 95.0% (19/20)
...
合計: 12 ファイル
```

数分かかっていた調査が、一瞬で終わる。

## CLAUDE.md に書いておけば勝手に使ってくれる

このコマンドの存在を Claude Code に伝えるには、CLAUDE.md に書いておくだけでいい。

```markdown
## テストカバレッジの確認

RSpec のカバレッジを確認する場合は以下のコマンドを使用:

bundle exec rake coverage:file[services]
bundle exec rake coverage:incomplete
bundle exec rake coverage:summary
```

これで「services 以下でカバレッジが低いファイルのテストを改善して」と指示すると、Claude Code は rake タスクを実行して即座に対象を特定し、すぐにテスト改善に入ってくれる。待ち時間が消えた。

## AI の「最善」と人間の「効率」は違う

AI アシスタントは与えられたツールの範囲で最善を尽くす。ただ、その「最善」が人間にとって効率的かどうかは別の話だ。

今回のケースでは、カバレッジ情報を取得する専用コマンドがなかった。だから Claude Code は汎用的な方法（HTML 解析やテスト実行）で対応しようとしていた。「やり方を知らない」のではなく、「近道がなかった」だけ。専用コマンドを用意したら、非効率は消えた。

頻繁に行う操作には、専用のツールを用意しておく。それが AI と協働するコツなのかもしれない。でも、こういうのは結局やってみないとわからない。

## 補足

coverage/.resultset.json は bundle exec rspec を実行すると生成・更新される。このファイルがない状態で rake タスクを実行するとエラーになるので、事前にテストを実行しておく必要がある。

また、このアプローチは SimpleCov を使っているプロジェクトであれば、Rails に限らず応用できる。JSON のパス（RSpec > coverage）は SimpleCov の設定によって異なる場合があるため、適宜調整してほしい。
