---
draft: false
emoji: 🎤
title: GitHub Actions で npm パッケージを公開する（アルファ版向け簡易フロー）
slug: publish-npm-package-github-actions-alpha
published_at: 2026-01-31 19:04:48
modified_at: 2026-01-31 19:04:48
tags:
  - GitHub
  - npm
preview: null
---

この記事では、GitHub Actions を使って monorepo 内の npm パッケージを手動で公開する仕組みを構築する手順を解説します。

> [!NOTE]
> この記事はアルファ版（プレリリース版）のパッケージを公開するための簡易的なフローを紹介しています。正式版のリリースには、CHANGELOG の更新や依存関係の確認など、追加の考慮事項があります。

## この仕組みで実現できること

- GitHub の Web UI からボタン一つでパッケージを公開
- 公開するパッケージをドロップダウンから選択
- バージョンの自動バンプ（patch / minor / major）
- アルファ版タグでの公開
- トークン管理不要の安全な認証（Trusted Publishing）

## 2025年12月の npm セキュリティ変更について

npm は 2025年12月9日に大きなセキュリティ変更を行いました。

### Classic Token の廃止

[2025年12月9日をもって Classic Token は完全に廃止](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/)されました:

- 既存の Classic Token はすべて無効化
- 新規作成も不可
- **Automation タイプのトークンも使用不可**

### Trusted Publishing（OIDC）の登場

代わりに推奨されているのが **Trusted Publishing** です。OpenID Connect（OIDC）を使用して、GitHub Actions から直接 npm に認証できます。

**メリット:**

- トークンの管理が不要
- トークン漏洩のリスクがない
- 90日ごとの更新作業が不要
- provenance 証明書が自動生成される

### pnpm と Trusted Publishing

> [!WARNING]
> pnpm は現時点で [Trusted Publishing (OIDC) をサポートしていません](https://github.com/pnpm/pnpm/issues/9812)。
> そのため、ビルドや依存関係のインストールには pnpm を使用し、**公開ステップのみ** `npm publish` を使用します。

## 事前準備

### 1. npmjs.com で Trusted Publisher を設定

各パッケージに対して、Trusted Publisher を設定します。

1. [npmjs.com](https://www.npmjs.com/) にログイン
2. 対象パッケージのページを開く（例: `@example/core`）
3. **Settings** タブを選択
4. **Trusted Publisher** セクションで **GitHub Actions** をクリック
5. 以下を入力:
   - **Organization or user**: `your-org`（GitHub のオーナー名）
   - **Repository**: `your-repo`（リポジトリ名）
   - **Workflow filename**: `npm-publish.yml`
   - **Environment name**: 空欄のまま（ワークフローで `environment` を使用していない場合）
6. **Set up connection** をクリック

> [!IMPORTANT]
> この設定を公開するパッケージすべてに対して行ってください。

### 2. package.json に repository を設定

Trusted Publishing では `package.json` の `repository.url` が GitHub URL と一致している必要があります。

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/your-repo.git",
    "directory": "packages/core"
  }
}
```

## ワークフローファイルの作成

`.github/workflows/npm-publish.yml` を作成します。

```yaml
name: Publish npm package

on:
  workflow_dispatch:
    inputs:
      package:
        description: '公開するパッケージを選択'
        required: true
        type: choice
        options:
          - '@example/core'
          - '@example/utils'
          - '@example/cli'
      version_type:
        description: 'バージョンの上げ方'
        required: true
        type: choice
        default: 'prerelease'
        options:
          - prerelease # 0.1.0-alpha.1 → 0.1.0-alpha.2
          - prepatch # 0.1.0-alpha.1 → 0.1.1-alpha.0
          - preminor # 0.1.0-alpha.1 → 0.2.0-alpha.0
          - premajor # 0.1.0-alpha.1 → 1.0.0-alpha.0

jobs:
  publish:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' # main ブランチからのみ実行可能
    permissions:
      contents: write
      id-token: write # OIDC Trusted Publishing に必要
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Get package directory
        id: package-dir
        run: |
          # パッケージ名からディレクトリを取得
          # 実際のプロジェクト構成に合わせて変更してください
          case "${{ inputs.package }}" in
            "@example/core")
              echo "dir=packages/core" >> $GITHUB_OUTPUT
              ;;
            "@example/utils")
              echo "dir=packages/utils" >> $GITHUB_OUTPUT
              ;;
            "@example/cli")
              echo "dir=packages/cli" >> $GITHUB_OUTPUT
              ;;
          esac

      - name: Build package
        run: pnpm turbo build --filter="${{ inputs.package }}"

      - name: Bump version
        id: version
        working-directory: ${{ steps.package-dir.outputs.dir }}
        run: |
          npm version ${{ inputs.version_type }} --preid=alpha --no-git-tag-version
          NEW_VERSION=$(node -p "require('./package.json').version")
          echo "new_version=$NEW_VERSION" >> $GITHUB_OUTPUT

      - name: Commit version bump
        run: |
          git add .
          git commit -m "release(${{ inputs.package }}): ${{ steps.version.outputs.new_version }}"
          git push

      - name: Create git tag
        id: tag
        run: |
          TAG_NAME="${{ inputs.package }}@${{ steps.version.outputs.new_version }}"
          git tag "$TAG_NAME"
          git push origin "$TAG_NAME"
          echo "tag_name=$TAG_NAME" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        run: gh release create "${{ steps.tag.outputs.tag_name }}" --title "${{ steps.tag.outputs.tag_name }}" --generate-notes --prerelease
        env:
          GH_TOKEN: ${{ github.token }}

      # Trusted Publishing: pnpm pack + npm publish
      # pnpm pack で workspace:* を実際のバージョンに解決した tarball を作成
      - name: Publish to npm (Trusted Publishing)
        working-directory: ${{ steps.package-dir.outputs.dir }}
        run: |
          pnpm pack
          npm publish *.tgz --access=public --tag alpha --provenance

      - name: Summary
        run: |
          echo "## Published successfully! :rocket:" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- **Package:** ${{ inputs.package }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Version:** ${{ steps.version.outputs.new_version }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Tag:** alpha" >> $GITHUB_STEP_SUMMARY
          echo "- **Auth:** Trusted Publishing (OIDC)" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "[View on npm](https://www.npmjs.com/package/${{ inputs.package }})" >> $GITHUB_STEP_SUMMARY
```

**ポイント:**

- `id-token: write` パーミッションが必須
- `npm publish --provenance` で provenance 証明書も自動生成
- トークンの設定は不要
- ビルドや依存関係のインストールには pnpm を使用し、**公開ステップのみ** npm を使用
- **main ブランチからのみ実行可能**（誤って他のブランチから公開することを防止）

## ワークフローの使い方

### 1. Actions タブを開く

GitHub リポジトリの **Actions** タブを開きます。

### 2. ワークフローを選択

左側のサイドバーから **Publish npm package** を選択します。

### 3. ワークフローを実行

1. **Run workflow** ボタンをクリック
2. 公開するパッケージをドロップダウンから選択
3. バージョンの上げ方を選択:
   - `prerelease`: アルファ版の番号のみ上げる（例: `0.1.0-alpha.1` → `0.1.0-alpha.2`）
   - `prepatch`: パッチバージョンを上げる（例: `0.1.0-alpha.1` → `0.1.1-alpha.0`）
   - `preminor`: マイナーバージョンを上げる（例: `0.1.0-alpha.1` → `0.2.0-alpha.0`）
   - `premajor`: メジャーバージョンを上げる（例: `0.1.0-alpha.1` → `1.0.0-alpha.0`）
4. **Run workflow** をクリック

### 4. 結果を確認

ワークフローが正常に完了すると:

- `package.json` のバージョンが更新される
- コミットが作成される
- Git タグ（例: `@example/core@0.1.0-alpha.12`）が作成される
- GitHub Release が作成される（プレリリースとしてマーク）
- npm にパッケージが公開される
- Job Summary に公開結果が表示される

## トラブルシューティング

### 404 エラーが出る

Trusted Publisher の設定が正しくない可能性があります:

- npmjs.com の Trusted Publisher 設定を確認
- ワークフローファイル名が設定と一致しているか確認
- `package.json` の `repository.url` が正しいか確認
- `id-token: write` パーミッションがあるか確認

### "Access token expired or revoked" エラー

Trusted Publishing を使用する場合、**npm >= 11.5.1** が必要です。Node.js 22 以前には npm 10.x しか同梱されていないため、**Node.js 24 以上**を使用してください。

### バージョンが正しく上がらない

- 既に同じバージョンが公開されている可能性があります
- ローカルの `package.json` と npm のバージョンを確認してください

### ビルドが失敗する

- `pnpm install` が正常に完了しているか確認
- 依存パッケージのビルドが正しく行われているか確認
- Turbo のフィルタリングが正しく動作しているか確認

## 正式版をリリースする場合

アルファ版から正式版に移行する場合は、ワークフローを修正するか、別のワークフローを作成してください:

1. `version_type` の選択肢に `patch`, `minor`, `major` を追加
2. `--preid=alpha` オプションを条件付きで適用
3. 公開タグを `alpha` から `latest` に変更

## 参考リンク

- [npm Trusted Publishing ドキュメント](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Changelog: npm セキュリティ変更](https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/)
- [GitHub Changelog: Classic Token 廃止](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/)
- [pnpm OIDC サポートリクエスト](https://github.com/pnpm/pnpm/issues/9812)
- [npm Trusted Publishing 設定ガイド](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/)

## まとめ

2025年12月の npm セキュリティ変更により、Classic Token は使用できなくなりました。Trusted Publishing (OIDC) を使用することで、トークン管理から解放され、より安全にパッケージを公開できます。

pnpm は現時点で OIDC をサポートしていないため、公開ステップのみ `npm publish` を使用しますが、ビルドや依存関係のインストールには引き続き pnpm を使用できます。
