---
draft: false
emoji: 🚣
title: Tailwind CSS v4 で max-h-[300px] を max-h-75 に自動修正するための設定
slug: tailwind-css-v4-automatic-arbitrary-values-with-rootfontsize
published_at: 2026-02-07 01:11:49
modified_at: 2026-02-07 01:11:49
tags:
  - Tailwind
  - ESLint
preview: null
---

## この記事のポイント

- eslint-plugin-better-tailwindcss の `enforce-canonical-classes` ルールは、arbitrary value を標準クラスに自動変換できる
- ただし `rootFontSize` を明示的に設定しないと、px 値の変換が動作しない
- `rootFontSize: 16` を settings に追加するだけで解決する

## arbitrary value とは

Tailwind CSS では、`p-4` や `text-sm` のように、あらかじめ用意されたユーティリティクラスを組み合わせてスタイリングします。しかし、用意されたクラスだけでは表現できない値が必要になることもあります。

そんなときに使うのが arbitrary value（任意値）です。角括弧 `[]` で囲んで、好きな CSS の値を直接指定できます。

```html
<!-- 標準クラス：あらかじめ定義された値を使う -->
<div class="max-h-75">...</div>

<!-- arbitrary value：任意の CSS 値を直接指定する -->
<div class="max-h-[300px]">...</div>
```

どちらも結果は同じ `max-height: 300px` ですが、書き方が異なります。この記事では、角括弧で書かれた arbitrary value を標準クラスに自動変換する方法と、その際の注意点を解説します。

## そもそも arbitrary value は避けるべき？

Tailwind CSS の公式ドキュメントには、arbitrary value について次のような記述があります。

> "While you can usually build the bulk of a well-crafted design using a constrained set of design tokens, once in a while you need to break out of those constraints to get things pixel-perfect."

arbitrary value は「制約から外れる必要があるときの最終手段」という位置づけです。標準のユーティリティクラスで表現できる値をわざわざ角括弧で書く理由はありません。

Tailwind CSS v4 では spacing scale が `1 = 4px` として定義されています。つまり `max-h-75` は `max-height: 300px` と等価であり、`max-h-[300px]` と書く必要がそもそもないのです。

標準クラスを使うことには、読みやすさ以外にもメリットがあります。v4 では `w-25` のような標準ユーティリティが `:root` に定義された CSS 変数（`var(--spacing-25)`）にマッピングされるのに対し、`w-[100px]` はハードコードされた値として生成されます。テーマの一貫性が損なわれるだけでなく、CSS ファイルの圧縮効率やビルド時のパフォーマンスにもわずかながら影響します。

にもかかわらず、shadcn/ui をはじめとする多くのコンポーネントライブラリでは、いまだに `max-h-[300px]` のような arbitrary value が使われています。Tailwind CSS v3 時代に書かれたコードがそのまま残っているケースも多いでしょう。

```tsx
// こう書かれているコードが
<CommandList className="max-h-[300px] overflow-y-auto" />

// こう書けるはず
<CommandList className="max-h-75 overflow-y-auto" />
```

これを手作業で置き換えるのは面倒ですが、ESLint で自動修正できるなら話は別です。

## eslint-plugin-better-tailwindcss の enforce-canonical-classes

eslint-plugin-better-tailwindcss には `enforce-canonical-classes` というルールがあります。recommended 設定に含まれていて、`eslint --fix` による自動修正にも対応しています。

このルールは Tailwind CSS v4 の内部 API（`canonicalizeCandidates`）を利用しており、冗長なクラスの簡略化も行います。

```tsx
// h-full w-full → size-full
// h-5 w-5 → size-5
```

ここまでは、recommended 設定を有効にするだけで動きます。

## 落とし穴は rootFontSize

ところが、`max-h-[300px]` のような px 指定の arbitrary value は、recommended 設定だけでは検出されません。

私も最初は「設定したのに動かない」と悩みました。ESLint の CLI では警告が出ないのに、VSCode の Tailwind CSS IntelliSense は指摘してくる。プラグインが壊れているのかと疑いましたが、原因はもっと単純でした。

settings に `rootFontSize` を指定していなかったのです。

```js:eslint.config.mjs
{
  plugins: {
    'better-tailwindcss': eslintPluginBetterTailwindcss,
  },
  rules: {
    ...eslintPluginBetterTailwindcss.configs.recommended.rules,
  },
  settings: {
    'better-tailwindcss': {
      entryPoint: 'src/styles/globals.css',
      rootFontSize: 16,  // これが必要
    },
  },
}
```

`rootFontSize` のデフォルト値は `undefined` です。未設定の場合、プラグインは px と rem の変換基準がわからないため、`max-h-[300px]` が `max-h-75`（= 75 \* 4px = 300px）に変換可能であることを判定できません。

`rootFontSize: 16` を追加した途端、検出されるようになります。

```sh
warning  The class: "max-h-[300px]" can be simplified to "max-h-75"
  better-tailwindcss/enforce-canonical-classes
```

あとは `eslint --fix` を実行するだけです。

## 実際に修正されるパターン

`rootFontSize: 16` を設定した状態で `eslint --fix` を実行すると、以下のような変換が行われます。

```css
/* px 指定の arbitrary value */
max-h-[300px]  →  max-h-75
max-w-[400px]  →  max-w-100

/* 負の値 */
translate-y-[-3px]  →  -translate-y-0.75

/* サイズの統合（rootFontSize とは無関係だが、同じルールで処理される） */
h-full w-full  →  size-full
h-5 w-5        →  size-5
```

## まとめ

eslint-plugin-better-tailwindcss で arbitrary value を標準クラスに自動変換したい場合、settings に `rootFontSize: 16` を追加してください。recommended ルールを有効にしただけでは px 値の変換は動作しません。

たった 1 行の設定ですが、これがないと `[300px]` のような記述がコードベースに残り続けます。Tailwind CSS v4 に移行したプロジェクトでは、早めに設定しておくことをおすすめします。

## 参考

- [Adding custom styles - Tailwind CSS](https://tailwindcss.com/docs/adding-custom-styles)
- [eslint-plugin-better-tailwindcss - enforce-canonical-classes](https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-canonical-classes.md)
