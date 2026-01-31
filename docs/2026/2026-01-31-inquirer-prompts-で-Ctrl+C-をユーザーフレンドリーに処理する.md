---
draft: false
emoji: ⌨️
title: '@inquirer/prompts で Ctrl+C をユーザーフレンドリーに処理する'
slug: handle-ctrlc-gracefully-in-inquirer-prompts
published_at: 2026-01-31 18:04:43
modified_at: 2026-01-31 18:04:43
tags:
  - Node.js
  - TypeScript
preview: null
---

## 問題

`@inquirer/prompts` を使った CLI ツールで、ユーザーが Ctrl+C でプロンプトを中断すると、以下のような例外のスタックトレースが表示されてしまう。これはユーザー体験として良くない。

```sh:Terminal
ExitPromptError: User force closed the prompt with 0 null
    at /path/to/node_modules/@inquirer/core/dist/esm/index.js:123:45
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    ...
```

## 原因

`@inquirer/prompts` では、ユーザーが Ctrl+C を押すとプロンプトの Promise が reject される。この際に `ExitPromptError` という名前のエラーがスローされる。

これは意図的な設計で、アプリケーションがクリーンアップ処理を行えるようにするためのもの。しかし、適切にハンドリングしないとスタックトレースがそのまま表示されてしまう。

## 解決策

グローバルな `uncaughtException` ハンドラを設定して、`ExitPromptError` の場合はユーザーフレンドリーなメッセージを表示する。

### ポイント: `instanceof` は使わない

`ExitPromptError` クラスを直接インポートして `instanceof` でチェックする方法は、[パッケージの構造上うまく動作しないケースがある](https://github.com/SBoudrias/Inquirer.js/issues/1475)。

代わりに `error.name === 'ExitPromptError'` でチェックするのが推奨されている。

### 実装例

```typescript
/**
 * プロンプトがキャンセルされたエラーかどうかを判定する
 */
function isPromptCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

// グローバルエラーハンドラ
process.on('uncaughtException', (error) => {
  if (isPromptCancelled(error)) {
    console.log('\nCancelled.');
    process.exit(0);
  }
  throw error;
});
```

これだけで、CLI のどこで Ctrl+C が押されても適切に処理される。

## 結果

修正前:

```sh:Terminal
? Enter title › ^C
ExitPromptError: User force closed the prompt with 0 null
    at /path/to/node_modules/@inquirer/core/dist/esm/index.js:123:45
    ...
```

修正後:

```sh:Terminal
? Enter title › ^C
Cancelled.
```

## 参考リンク

- [Handle ctrl+c gracefully · Issue #1502 · SBoudrias/Inquirer.js](https://github.com/SBoudrias/Inquirer.js/issues/1502)
- [instanceof always returning false when checking for ExitPrompError errors · Issue #1475](https://github.com/SBoudrias/Inquirer.js/issues/1475)
- [@inquirer/prompts - npm](https://www.npmjs.com/package/@inquirer/prompts)
