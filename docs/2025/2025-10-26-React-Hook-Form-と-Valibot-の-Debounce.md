---
draft: false
emoji: 💺
title: React Hook Form と Valibot の debounce
slug: debounce-of-react-hook-form-and-valibot
published_at: 2025-10-26 19:53:00
modified_at: 2025-10-26 19:53:00
tags:
  - React
  - Valibot
  - React Hook Form
preview: null
---

## はじめに

React Hook Form と Valibot を用いたフォーム実装において、メールアドレスの重複チェックなどサーバー側の非同期バリデーションを行うと、入力ごとに API を呼び出してしまい、パフォーマンスやコストに悪影響を与えることがあります。こうした問題に対して有効なのが「デバウンス（debounce）」です。ユーザーの入力が停止してから一定時間待機してから検証を実行することで、不要なリクエストを削減できます。

本記事では、React Hook Form と Valibot にデバウンスを組み込む方法を実装例とともに示します。中心となるのはカスタムフック `useDebouncedValidator` と、これを利用するフォームフック `useSignupForm` です。サンプルリポジトリも用意しているため、手元で動作を確認しながら理解を深めてください。

::link-card[https://github.com/naopoyo/valibot-debounce-example]

## デバウンスとは

フォームのリアルタイムバリデーションで入力ごとにサーバーへ問い合わせを行う（特に `onChange` ごとに発行する実装）と、次のような問題が生じます。

- パフォーマンスへの影響: 頻繁な API 呼び出しによりサーバー負荷が増加し、レスポンス遅延が発生し得ます。
- ユーザー体験の低下: 入力途中で頻繁にエラーメッセージが出ると入力が妨げられ、入力操作時に UI のジャンクが発生する場合があります。
- 運用コストの増大: API 呼び出し回数が増えることでクラウド利用料が上昇する可能性があります。
- レスポンスの競合（race conditions）: 連続したリクエストが並行して進行すると、古いレスポンスが後から到着して正しい状態を上書きしてしまうことがあります。

デバウンスは、指定した待機時間（例: 500ms）だけ入力の停止を待ってから検証処理を実行することで、上記の問題を緩和する手法です。

## コード例

### use-debounced-validator.ts

デバウンスのコアとなるカスタムフックです。チェック関数を遅延実行してくれる便利な仕組みです。

<details><summary>use-debounced-validator.tsを見る</summary>

```ts:use-debounced-validator.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ValidateFn<T> = (value: T) => Promise<boolean> | boolean;

type Options<T> = {
  delay?: number;
  negate?: boolean;
  defaultValue?: T | undefined;
};

export function useDebouncedValidator<T = string>(
  validate: ValidateFn<T>,
  options: Options<T> = {}
) {
  const memoizedOptions = useMemo(() => options, [options]);
  const { delay = 500, negate = false, defaultValue } = memoizedOptions;

  const [lastResult, setLastResult] = useState(false);
  const lastValueRef = useRef<T | undefined>(defaultValue);
  const lastResultRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResolversRef = useRef<Array<(result: boolean) => void>>([]);
  const pendingValueRef = useRef<T | undefined>(undefined);

  const flushResolvers = (result: boolean) => {
    const resolvers = pendingResolversRef.current.splice(0);
    resolvers.forEach((resolve) => resolve(result));
  };

  const performValidation = useCallback(
    async (currentValue: T) => {
      try {
        const rawResult = await validate(currentValue);
        const result = negate ? !rawResult : rawResult;

        lastValueRef.current = currentValue;
        lastResultRef.current = result;
        if (lastResult !== result) {
          setLastResult(result);
        }
        flushResolvers(result);
      } catch {
        const result = false;
        lastValueRef.current = currentValue;
        lastResultRef.current = result;
        if (lastResult !== result) {
          setLastResult(result);
        }
        flushResolvers(result);
      }
    },
    [validate, negate, lastResult]
  );

  const debouncedValidator = useCallback(
    (value: T): Promise<boolean> => {
      if (Object.is(value, defaultValue)) {
        return Promise.resolve(true);
      }

      if (lastValueRef.current === value && timerRef.current === null) {
        return Promise.resolve(lastResultRef.current);
      }

      return new Promise<boolean>((resolve) => {
        pendingResolversRef.current.push(resolve);
        pendingValueRef.current = value;

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(async () => {
          timerRef.current = null;
          const currentValue = pendingValueRef.current!;

          if (currentValue !== value) {
            return;
          }

          await performValidation(currentValue);
        }, delay);
      });
    },
    [delay, defaultValue, performValidation]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flushResolvers(lastResultRef.current);
    };
  }, []);

  return { debouncedValidator, lastResult } as const;
}
```

</details>

### use-signup-form.ts

React Hook Form と Valibot を組み合わせたサインアップフォーム用のフックです。デバウンスを活かしてメールチェックを実装しています。

<details><summary>use-signup-form.tsを見る</summary>

```ts:use-signup-form.ts
'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm } from 'react-hook-form';
import * as v from 'valibot';

import { useDebouncedValidator } from './use-debounced-validator';

export const inputSchema = (debouncedValidator: (value: string) => Promise<boolean>) =>
  v.objectAsync({
    name: v.pipe(v.string(), v.minLength(1, 'This field is required')),
    email: v.pipeAsync(
      v.string(),
      v.minLength(1, 'This field is required'),
      v.email('Please enter a valid email format'),
      v.checkAsync(debouncedValidator, 'This email is not available')
    ),
  });

export type Inputs = v.InferOutput<ReturnType<typeof inputSchema>>;

export function useSignupForm() {
  const isValidEmail = async (value: string) => {
    const response = await fetch('/api?email=' + encodeURIComponent(value), {
      method: 'GET',
    });
    const data = (await response.json()) as { result: boolean };
    return !data.result;
  };

  const { debouncedValidator } = useDebouncedValidator<string>(isValidEmail);

  const schema = inputSchema(debouncedValidator);

  const form = useForm({
    mode: 'all',
    resolver: valibotResolver(schema, {}, { mode: 'async' }),
    defaultValues: { name: '', email: '' },
  });

  return form;
}
```

</details>

## コードの解説

Valibot、React Hook Form、`useDebouncedValidator` の3つがどのようにしてデバウンスされた非同期バリデーションを実現しているかを説明します。

### 1. React Hook Form の役割

React Hook Form は、フォームの状態管理と検証のトリガーを担当します。`useForm` フックで作成された `form` オブジェクトは、コンポーネントで `register` や `handleSubmit` などのメソッドを提供します。検証は `mode: 'all'` で全フィールドに対してリアルタイムに行われ、`resolver` オプションで外部のバリデーションライブラリ（ここでは Valibot）を統合します。

### 2. Valibot Resolver の統合

`valibotResolver` は、React Hook Form と Valibot を橋渡しするアダプターです。`useForm` の `resolver` に `valibotResolver(schema)` を渡すことで、フォームの入力値が Valibot のスキーマに基づいて検証されます。スキーマは `inputSchema` で定義され、`v.objectAsync` を使って非同期バリデーションをサポートします。

### 3. Valibot の checkAsync とデバウンスの適用

Valibot の `v.checkAsync(debouncedValidator, 'This email is not available')` は、非同期チェック関数を受け取り、Promise を返す検証を行います。ここで `debouncedValidator` （`useDebouncedValidator` から提供される関数）を渡すことで、通常の即時API呼び出しではなく、デバウンスされた検証が可能になります。

- **debouncedValidator の動作**: `useDebouncedValidator` は、渡された `isValidEmail` 関数をラップし、500ms の遅延後にのみ実行します。これにより、ユーザーの入力が停止するまでAPI呼び出しを待機します。

### 4. サンプルコード全体のフロー

1. ユーザーが email フィールドに入力すると、React Hook Form が `onChange` イベントで検証をトリガーします。
2. `valibotResolver` が Valibot スキーマを実行し、`checkAsync` を呼び出します。
3. `checkAsync` が `debouncedValidator` を実行しますが、`useDebouncedValidator` は即座に実行せず、タイマーをセットします。
4. 入力が停止してから500ms後、`isValidEmail` がAPIを呼び出し、結果を取得します。
5. React Hook Form が検証結果をフォーム状態に反映し、UIを更新します。

この連携により、Valibot の型安全なスキーマ定義、React Hook Form の高性能なフォーム管理、`useDebouncedValidator` のデバウンス機能がシームレスに統合され、パフォーマンスとユーザー体験を両立したフォームが実現されます。

## まとめ

デバウンスを導入することで、フォームの検証に伴う不要な API 呼び出しを削減できます。結果として、パフォーマンス、ユーザー体験、および運用コストの改善が期待できます。
