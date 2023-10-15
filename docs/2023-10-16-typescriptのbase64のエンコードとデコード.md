---
draft: true
emoji: 🔄
title: TypeScriptのBase64のエンコードとデコード
slug: encode-and-decode-base64-in-typescript
published_at: 2023-10-16 01:54:32
modified_at: 2023-10-16 01:54:32
tags:
    - TypeScript
preview: null
---

TypeScript/JavascriptでBase64のエンコードとデコードの方法です。。

## Buffer

Node.jsの場合は、Bufferを使えます。

### import

```typescript
import { Buffer } from 'buffer'
```

### エンコード

```typescript
const encodedData = Buffer.from('Hello, world').toString('base64')
```

URL safeなBase64の場合(**利用できない環境もある**):

```typescript
const encodedData = Buffer.from('Hello, world').toString('base64url')
```

### デコード

```typescript
const decodedData = Buffer.from(encodedData, 'base64').toString()
```

URL safeなBase64の場合(**利用できない環境もある**):

```typescript
const decodedData = Buffer.from(encodedData, 'base64url').toString()
```

----------


## btoa / atob

Javascriptだけで行う場合は以下のとおりです。

### エンコード

```typescript
var encodedData = window.btoa('Hello, world')
```

### デコード

```typescript
var decodedData = window.atob(encodedData)
```

### ユニコードの文字列を扱う場合

btoaとatobはASCII文字列しか対応していないので、ユニコードの文字列を扱う場合は以下のようにします。**unescapeとescapeは非推奨**。

#### エンコード

```typescript
var encodedData = window.btoa(unescape(encodeURIComponent('こんにちは')))
```

#### デコード

```typescript
var decodedData = decodeURIComponent(escape(window.atob(encodedData)))
```
