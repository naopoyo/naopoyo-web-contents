import { registerCardImage } from 'https://cdn.jsdelivr.net/npm/@frontmatter/extensibility/+esm'

registerCardImage(async (_filePath, metadata) => {
  const image = metadata.fmPreviewImage ? metadata.fmPreviewImage : null
  if (image) {
    return `
      <div class="h-full flex items-center justify-center bg-[var(--vscode-sideBar-background)] group-hover:bg-[var(--vscode-list-hoverBackground)]">
        <img src=${image} />
      </div>
    `
  } else if (metadata.emoji) {
    return `
      <div class="h-full w-full flex items-center justify-center">
        <div style="font-size: 64px;">
          ${metadata.emoji}
        </div>
      </div>
    `
  }

  return null
})
