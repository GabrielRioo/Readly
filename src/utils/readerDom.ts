const LOOKUP_ATTR = 'data-reader-lookup'
const BOOKMARK_ATTR = 'data-reader-bookmark'
const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre'

export function highlightSelectionIn(root: HTMLElement): boolean {
  clearLookupHighlight(root)
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return false

  const mark = document.createElement('mark')
  mark.className = 'reader-lookup-mark'
  mark.setAttribute(LOOKUP_ATTR, '1')

  try {
    range.surroundContents(mark)
  } catch {
    mark.appendChild(range.extractContents())
    range.insertNode(mark)
  }

  selection.removeAllRanges()
  return true
}

export function clearLookupHighlight(root: HTMLElement | null): void {
  if (!root) return
  root.querySelectorAll(`mark[${LOOKUP_ATTR}]`).forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize()
  })
}

export function listReaderBlocks(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).filter((block) => {
    const text = block.textContent?.replace(/\s+/g, ' ').trim()
    return Boolean(text)
  })
}

export function findBookmarkBlockIndex(scroller: HTMLElement, body: HTMLElement): number {
  const blocks = listReaderBlocks(body)
  if (blocks.length === 0) return -1

  const targetY = scroller.getBoundingClientRect().top + Math.min(scroller.clientHeight * 0.28, 120)
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  blocks.forEach((block, index) => {
    const top = block.getBoundingClientRect().top
    const distance = Math.abs(top - targetY)
    if (top <= targetY + 8 && distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  })

  return bestIndex
}

export function applyBookmarkMark(body: HTMLElement, blockIndex: number | null): void {
  clearBookmarkMark(body)
  if (blockIndex === null || blockIndex < 0) return
  const block = listReaderBlocks(body)[blockIndex]
  if (!block) return
  block.setAttribute(BOOKMARK_ATTR, '1')
  block.classList.add('reader-bookmark')
}

export function clearBookmarkMark(body: HTMLElement | null): void {
  if (!body) return
  body.querySelectorAll(`[${BOOKMARK_ATTR}]`).forEach((block) => {
    block.removeAttribute(BOOKMARK_ATTR)
    block.classList.remove('reader-bookmark')
  })
}

export function scrollToBookmark(scroller: HTMLElement, body: HTMLElement, blockIndex: number): void {
  const block = listReaderBlocks(body)[blockIndex]
  if (!block) return
  const scrollerTop = scroller.getBoundingClientRect().top
  const blockTop = block.getBoundingClientRect().top
  scroller.scrollTop += blockTop - scrollerTop - 24
}
