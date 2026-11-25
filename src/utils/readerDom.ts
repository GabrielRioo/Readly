const LOOKUP_ATTR = 'data-reader-lookup'
const BOOKMARK_ATTR = 'data-reader-bookmark'

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
  unwrapMarks(root, `mark[${LOOKUP_ATTR}]`)
}

export function clearBookmarkMark(root: HTMLElement | null): void {
  if (!root) return
  unwrapMarks(root, `mark[${BOOKMARK_ATTR}]`)
}

export function promoteLookupToBookmark(
  root: HTMLElement,
): { startOffset: number; length: number; quote: string } | null {
  const mark = root.querySelector<HTMLElement>(`mark[${LOOKUP_ATTR}]`)
  if (!mark) return null

  const quote = (mark.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!quote) return null

  const startOffset = textOffsetOf(root, mark)
  if (startOffset < 0) return null
  const length = mark.textContent?.length ?? 0
  if (length <= 0) return null

  clearBookmarkMark(root)

  mark.removeAttribute(LOOKUP_ATTR)
  mark.classList.remove('reader-lookup-mark')
  mark.className = 'reader-bookmark-mark'
  mark.setAttribute(BOOKMARK_ATTR, '1')

  return { startOffset, length, quote }
}

export function applyBookmarkByOffset(
  root: HTMLElement,
  startOffset: number,
  length: number,
): boolean {
  clearBookmarkMark(root)
  if (startOffset < 0 || length <= 0) return false

  const range = rangeFromOffsets(root, startOffset, startOffset + length)
  if (!range) return false

  const mark = document.createElement('mark')
  mark.className = 'reader-bookmark-mark'
  mark.setAttribute(BOOKMARK_ATTR, '1')

  try {
    range.surroundContents(mark)
  } catch {
    mark.appendChild(range.extractContents())
    range.insertNode(mark)
  }

  return true
}

export function scrollToBookmarkMark(scroller: HTMLElement, root: HTMLElement): void {
  const mark = root.querySelector<HTMLElement>(`mark[${BOOKMARK_ATTR}]`)
  if (!mark) return
  const scrollerTop = scroller.getBoundingClientRect().top
  const markTop = mark.getBoundingClientRect().top
  scroller.scrollTop += markTop - scrollerTop - 24
}

function unwrapMarks(root: HTMLElement, selector: string): void {
  root.querySelectorAll(selector).forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize()
  })
}

function textOffsetOf(root: HTMLElement, target: Node): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let offset = 0
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (target === node || (target.nodeType === Node.ELEMENT_NODE && target.contains(node))) {
      return offset
    }
    offset += node.textContent?.length ?? 0
  }
  return -1
}

function rangeFromOffsets(root: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let offset = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let node: Node | null

  while ((node = walker.nextNode())) {
    const text = node as Text
    const length = text.data.length
    const next = offset + length

    if (!startNode && start >= offset && start <= next) {
      startNode = text
      startOffset = start - offset
    }
    if (!endNode && end >= offset && end <= next) {
      endNode = text
      endOffset = end - offset
      break
    }

    offset = next
  }

  if (!startNode || !endNode) return null
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}
