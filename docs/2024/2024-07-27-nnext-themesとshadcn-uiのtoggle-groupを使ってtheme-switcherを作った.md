---
draft: false
emoji: 🔨
title: next-themesとshadcn/uiのToggle Groupを使ってTheme Switcherを作った
slug: create-a-theme-switcher-using-next-themes-and-shadcn-ui
published_at: 2024-07-27 12:41:00
modified_at: 2024-07-27 12:41:00
tags:
  - shadcn/ui
  - next-themes
preview: /assets/2024-07-27-nnext-themesとshadcn-uiのtoggle-groupを使ってtheme-switcherを作った/ThemeSwitcher.png
type: default
---

## 作成したTheme Switcher

画像のようなTheme Switcherを作成しました。[shadcn/uiのToggle Group](https://ui.shadcn.com/docs/components/toggle-group)と[next-themes](https://github.com/pacocoursey/next-themes)を使って、最小限のスタイル調整でNext.jsの公式サイトで使われているものと同じような見た目を再現しています。

次のコードをNext.jsで使ってみてください。

<details><summary>Theme Switcherのコード</summary>

```tsx:src/components/theme-switcher.tsx
'use client'

import { ComputerIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || theme === undefined) {
    return
  }

  return (
    <ToggleGroup
      className='rounded-full border p-1'
      size='sm'
      type='single'
      value={theme}
      onValueChange={(value) => setTheme(value)}
    >
      <ToggleGroupItem className='rounded-full' value='dark' aria-label='Toggle dark'>
        <MoonIcon size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem className='rounded-full' value='system' aria-label='Toggle system'>
        <ComputerIcon size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem className='rounded-full' value='light' aria-label='Toggle light'>
        <SunIcon size={16} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

</details>

## ThemeSwitcherを使用する方法

上記のThemeSwitcherを使用するためには、次のドキュメントの通りに必要なパッケージを追加していく必要があります。

1. shadcn/uiをインストール

   ::link-card[https://ui.shadcn.com/docs/installation/next]

2. ダークモードの設定

   ::link-card[https://ui.shadcn.com/docs/dark-mode/next]

3. Toggle Groupを追加

   ```sh:Terminal
   pnpm dlx shadcn-ui@latest add toggle-group
   ```
