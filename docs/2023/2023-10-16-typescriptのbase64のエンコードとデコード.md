---
draft: false
emoji: 🔄
title: TypeScriptのBase64のエンコードとデコード
slug: encode-and-decode-base64-in-typescript
published_at: 2023-10-16 01:54:32
modified_at: 2024-07-23 20:51:42
tags:
  - TypeScript
preview: null
---

## この記事について

TypeScript/JavascriptでBase64のエンコードとデコードの方法を紹介しています。Node.jsの場合はBufferを、それ以外の場合はTextEncoderとTextDecoderを使うことをおすすめします。

## Bufferを使用する場合

Node.jsの場合はBufferを使用できます。以下のようにimportします。

```typescript
import { Buffer } from 'buffer'
```

### Bufferを使ったエンコード

```typescript
const encodedData = Buffer.from('Hello, world').toString('base64')
```

### Bufferを使ったエンコード （URL safe）

URL safeなBase64エンコードの場合は以下のように `base64url` を指定します。クライアント側で動かす場合など、利用できない環境があります。

```typescript
const encodedData = Buffer.from('Hello, world').toString('base64url')
```

### Bufferを使ったデコード

```typescript
const decodedData = Buffer.from(encodedData, 'base64').toString()
```

### Bufferを使ったデコード （URL safe）

URL safeなBase64デコードの場合は以下のように `base64url` を指定します。クライアント側で動かす場合など、利用できない環境があります。

```typescript
const decodedData = Buffer.from(encodedData, 'base64url').toString()
```

## Bufferを使用しない場合

Bufferを使用しない場合はbtoa、atobを使用します。

### btoaによるエンコード

```typescript
const encodedData = btoa('Hello, world')
```

### atobによるデコード

```typescript
const decodedData = atob(encodedData)
```

### Unicode文字列を扱う場合 その1 (TextEncoderとTextDecoderを使う)

btoaとatobはASCII文字列しか対応していないので、Unicode文字列を扱う場合は以下のようにします。

#### TextEncoderを使うエンコード

```typescript
const str = 'こんにちは'
const encodedData = btoa(String.fromCharCode(...Array.from(new TextEncoder().encode(str))))
```

`encodedData` は `44GT44KT44Gr44Gh44Gv` になります。

#### TextDecoderを使うデコード

```typescript
const encodedData = '44GT44KT44Gr44Gh44Gv'
const decodedData = new TextDecoder().decode(
  Uint8Array.from(atob(encodedData), (c) => c.charCodeAt(0))
)
```

`decodedData` は `こんにちは` になります。

### Unicode文字列を扱う場合 その2 (unescapeとescapeを使う)

btoaとatobはASCII文字列しか対応していないので、Unicode文字列を扱う場合は以下のようにします。**unescapeとescapeは非推奨**なので前述のTextEncoderとTextDecoderを使う方法をおすすめします。

#### unescapeを使うUnicode文字列のエンコード

```typescript
const encodedData = btoa(unescape(encodeURIComponent('こんにちは')))
```

`encodedData` は `44GT44KT44Gr44Gh44Gv` になります。

#### escapeを使うUnicode文字列のデコード

```typescript
const decodedData = decodeURIComponent(escape(atob(encodedData)))
```

`decodedData` は `こんにちは` になります。
