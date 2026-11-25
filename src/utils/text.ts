export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  return base || 'Sem título'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatPercent(progress: number): string {
  return `${Math.round(clamp(progress, 0, 1) * 100)}%`
}

export function readingProgress(sectionCount: number, sectionIndex: number, scrollRatio: number): number {
  if (sectionCount <= 0) return 0
  const ratio = clamp(scrollRatio, 0, 1)
  const index = clamp(sectionIndex, 0, sectionCount - 1)
  const value = sectionCount === 1 ? ratio : (index + ratio) / sectionCount
  return clamp(value, 0, 1)
}

export function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function plainTextToHtml(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return '<p>Este trecho não tem texto selecionável.</p>'
  }

  return blocks
    .map((block) => `<p>${escapeHtml(block).replaceAll('\n', '<br />')}</p>`)
    .join('')
}

export function htmlToPlainText(html: string): string {
  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  return (documentNode.body.textContent ?? '').replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
}

export function selectedTextWithin(root: HTMLElement): string {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return ''
  const anchor = selection.anchorNode
  const focus = selection.focusNode
  if (!anchor || !focus || !root.contains(anchor) || !root.contains(focus)) return ''
  return selection.toString().replace(/\s+/g, ' ').trim()
}

const WORD_CHAR = /[A-Za-z\u00C0-\u024F'’-]/

export function wordAtPoint(x: number, y: number, root: HTMLElement): string | null {
  const position = caretAtPoint(x, y)
  if (!position || !root.contains(position.node) || position.node.nodeType !== Node.TEXT_NODE) return null

  const text = position.node.textContent ?? ''
  let start = position.offset
  let end = position.offset
  if (start > 0 && !WORD_CHAR.test(text[start] ?? '') && WORD_CHAR.test(text[start - 1] ?? '')) {
    start -= 1
    end -= 1
  }
  if (!WORD_CHAR.test(text[start] ?? '') && !WORD_CHAR.test(text[end] ?? '')) return null

  while (start > 0 && WORD_CHAR.test(text[start - 1] ?? '')) start -= 1
  while (end < text.length && WORD_CHAR.test(text[end] ?? '')) end += 1

  const word = text.slice(start, end).replace(/^['’-]+|['’-]+$/g, '')
  if (!/[A-Za-z]/.test(word)) return null
  return word
}

function caretAtPoint(x: number, y: number): { node: Node; offset: number } | null {
  const documentWithCaret = document as Document & {
    caretPositionFromPoint?: (pointX: number, pointY: number) => { offsetNode: Node; offset: number } | null
    caretRangeFromPoint?: (pointX: number, pointY: number) => Range | null
  }

  if (documentWithCaret.caretPositionFromPoint) {
    const position = documentWithCaret.caretPositionFromPoint(x, y)
    if (!position) return null
    return { node: position.offsetNode, offset: position.offset }
  }

  const range = documentWithCaret.caretRangeFromPoint?.(x, y)
  if (!range) return null
  return { node: range.startContainer, offset: range.startOffset }
}
