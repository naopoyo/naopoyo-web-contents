---
draft: false
emoji: 🐺
title: shadcn/uiをNext.jsで使う
slug: using-shadcn-ui-with-next-js
published_at: 2024-06-16 00:58:09
modified_at: 2024-06-16 00:58:09
tags:
  - React
  - UI
  - Next.js
preview: null
---

## 概要

::link-card[https://ui.shadcn.com/]

この記事では、カスタマイズ性の高いUIコンポーネントであるshadcn/uiの使い方やカスタマイズの方法を紹介しています。

## Sheetコンポーネントの横幅を変更する

`pnpx shadcn-ui@latest add sheet` で作成された以下のコードから `sm:max-w-sm` を取り除きます。

```tsx:components/ui/sheet.tsx
// [!code word:sm\:max-w-sm]
// ...
variants: {
    side: {
    top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
    bottom:
        'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm', // [!code --]
    left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left', // [!code ++]
    right:
        'inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm', // [!code --]
        'inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right', // [!code ++]
    },
// ...
},
```

`<SheetContent>` に横幅を指定します。

```tsx
<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent className='w-full sm:w-2/5'>
    <p>Content</p>
  </SheetContent>
</Sheet>
```
