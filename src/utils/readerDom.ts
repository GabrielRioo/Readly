const LOOKUP_ATTR = 'data-reader-lookup'
const BOOKMARK_ATTR = 'data-reader-bookmark'
const VOCAB_ATTR = 'data-reader-vocab'
const VOCAB_ID_ATTR = 'data-vocab-id'

export interface TextSpanLocation {
  startOffset: number
  length: number
  quote: string
}

export interface VocabularyMarkInput {
  id: string
  startOffset: number
  length: number
}

export function highlightSelectionIn(root: HTMLElement): boolean {
  clearLookupHighlight(root)
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return false

  const marks = wrapRangeInPlace(range, () => {
    const mark = document.createElement('mark')
    mark.className = 'reader-lookup-mark'
    mark.setAttribute(LOOKUP_ATTR, '1')
    return mark
  })

  selection.removeAllRanges()
  return marks.length > 0
}

export function clearLookupHighlight(root: HTMLElement | null): void {
  if (!root) return
  unwrapMarks(root, `mark[${LOOKUP_ATTR}]`)
}

export function clearBookmarkMark(root: HTMLElement | null): void {
  if (!root) return
  unwrapMarks(root, `mark[${BOOKMARK_ATTR}]`)
}

export function clearVocabularyMarks(root: HTMLElement | null): void {
  if (!root) return
  unwrapMarks(root, `mark[${VOCAB_ATTR}]`)
}

export function getLookupMarkLocation(root: HTMLElement): TextSpanLocation | null {
  const marks = [...root.querySelectorAll<HTMLElement>(`mark[${LOOKUP_ATTR}]`)]
  if (marks.length === 0) return null
  return locationFromMarks(root, marks)
}

export function promoteLookupToBookmark(root: HTMLElement): TextSpanLocation | null {
  const location = getLookupMarkLocation(root)
  if (!location) return null

  clearLookupHighlight(root)
  if (!applyBookmarkByOffset(root, location.startOffset, location.length)) return null
  return location
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

  const marks = wrapRangeInPlace(range, () => {
    const mark = document.createElement('mark')
    mark.className = 'reader-bookmark-mark'
    mark.setAttribute(BOOKMARK_ATTR, '1')
    return mark
  })

  return marks.length > 0
}

export function applyVocabularyMarks(root: HTMLElement, marks: VocabularyMarkInput[]): void {
  clearVocabularyMarks(root)
  const ordered = [...marks]
    .filter((mark) => mark.length > 0 && mark.startOffset >= 0)
    .sort((a, b) => b.startOffset - a.startOffset)

  for (const item of ordered) {
    const range = rangeFromOffsets(root, item.startOffset, item.startOffset + item.length)
    if (!range) continue

    wrapRangeInPlace(range, () => {
      const mark = document.createElement('mark')
      mark.className = 'reader-vocab-mark'
      mark.setAttribute(VOCAB_ATTR, '1')
      mark.setAttribute(VOCAB_ID_ATTR, item.id)
      mark.title = 'Palavra salva no vocabulário'
      return mark
    })
  }
}

export function scrollToBookmarkMark(scroller: HTMLElement, root: HTMLElement): void {
  const mark = root.querySelector<HTMLElement>(`mark[${BOOKMARK_ATTR}]`)
  if (!mark) return
  scrollMarkIntoView(scroller, mark)
}

export function scrollToVocabularyMark(
  scroller: HTMLElement,
  root: HTMLElement,
  entryId?: string,
): boolean {
  const mark = entryId
    ? root.querySelector<HTMLElement>(`mark[${VOCAB_ID_ATTR}="${CSS.escape(entryId)}"]`)
    : root.querySelector<HTMLElement>(`mark[${VOCAB_ATTR}]`)
  if (!mark) return false
  scrollMarkIntoView(scroller, mark)
  return true
}

export function vocabularyIdFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null
  const mark = target.closest(`mark[${VOCAB_ATTR}]`)
  if (!(mark instanceof HTMLElement)) return null
  return mark.getAttribute(VOCAB_ID_ATTR)
}

function scrollMarkIntoView(scroller: HTMLElement, mark: HTMLElement): void {
  const scrollerTop = scroller.getBoundingClientRect().top
  const markTop = mark.getBoundingClientRect().top
  scroller.scrollTop += markTop - scrollerTop - 24
}

function locationFromMarks(root: HTMLElement, marks: HTMLElement[]): TextSpanLocation | null {
  const first = marks[0]
  if (!first) return null

  const startOffset = textOffsetOf(root, first)
  if (startOffset < 0) return null

  const last = marks[marks.length - 1]!
  const lastStart = textOffsetOf(root, last)
  if (lastStart < 0) return null

  const endOffset = lastStart + (last.textContent?.length ?? 0)
  const length = endOffset - startOffset
  if (length <= 0) return null

  const quote = marks
    .map((mark) => mark.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  if (!quote) return null

  return { startOffset, length, quote }
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

/**
 * Wrap each intersecting text node in place. Avoids surroundContents/extractContents,
 * which can pull text out of a block when the selection starts at an element boundary
 * (common on mobile at the start of a paragraph).
 */
function wrapRangeInPlace(range: Range, createMark: () => HTMLElement): HTMLElement[] {
  if (range.collapsed) return []

  const segments = textSegmentsInRange(range)
  if (segments.length === 0) return []

  const marks: HTMLElement[] = []

  // Walk backwards so earlier splitText calls do not invalidate later node references.
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]!
    let text = segment.node
    let from = segment.start
    let to = segment.end

    if (from >= to) continue

    if (to < text.length) text.splitText(to)
    if (from > 0) {
      text = text.splitText(from)
    }

    const parent = text.parentNode
    if (!parent) continue

    const mark = createMark()
    parent.insertBefore(mark, text)
    mark.appendChild(text)
    marks.unshift(mark)
  }

  return marks
}

interface TextSegment {
  node: Text
  start: number
  end: number
}

function textSegmentsInRange(range: Range): TextSegment[] {
  const root = range.commonAncestorContainer
  const walkerRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root
  if (!walkerRoot) return []

  const segments: TextSegment[] = []
  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT)
  let node: Node | null

  while ((node = walker.nextNode())) {
    const text = node as Text
    if (!intersectsRange(text, range)) continue

    const start = text === range.startContainer ? range.startOffset : 0
    const end = text === range.endContainer ? range.endOffset : text.length
    if (start >= end) continue
    segments.push({ node: text, start, end })
  }

  return segments
}

function intersectsRange(node: Text, range: Range): boolean {
  const nodeRange = document.createRange()
  nodeRange.selectNodeContents(node)
  return (
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
  )
}
