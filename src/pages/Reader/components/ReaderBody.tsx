import { Box } from '@mui/material'
import { forwardRef, useLayoutEffect, useRef } from 'react'
import type { ReadingBookmark } from '../../../types/book.ts'
import type { VocabularyRecord } from '../../../types/vocabulary.ts'
import { hasVocabularyLocation } from '../../../types/vocabulary.ts'
import {
  applyBookmarkByOffset,
  applyVocabularyMarks,
  clearBookmarkMark,
  clearVocabularyMarks,
} from '../../../utils/readerDom.ts'

export const ReaderBody = forwardRef<
  HTMLDivElement,
  {
    html: string
    fontSize: number
    lineHeight: number
    bookmark: ReadingBookmark | null
    vocabulary: VocabularyRecord[]
    focusVocabularyId?: string | null
  }
>(function ReaderBody(
  { html, fontSize, lineHeight, bookmark, vocabulary, focusVocabularyId },
  ref,
) {
  const localRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const element = localRef.current
    if (!element) return

    const marks = vocabulary.filter(hasVocabularyLocation).map((entry) => ({
      id: entry.id,
      startOffset: entry.startOffset,
      length: entry.length,
    }))

    if (marks.length === 0) clearVocabularyMarks(element)
    else applyVocabularyMarks(element, marks)

    if (!bookmark || typeof bookmark.startOffset !== 'number' || bookmark.length <= 0) {
      clearBookmarkMark(element)
    } else {
      applyBookmarkByOffset(element, bookmark.startOffset, bookmark.length)
    }

    if (focusVocabularyId) {
      const mark = element.querySelector<HTMLElement>(
        `mark[data-vocab-id="${CSS.escape(focusVocabularyId)}"]`,
      )
      mark?.classList.add('reader-vocab-mark-focus')
    }
  }, [html, bookmark, vocabulary, focusVocabularyId])

  return (
    <Box
      sx={{
        maxWidth: 680,
        mx: 'auto',
        px: 2.5,
        pt: 2,
        pb: 4,
      }}
    >
      <Box className="reader-page-start" aria-hidden>
        <span className="reader-page-start-rule" />
        <span className="reader-page-start-label">Início da página</span>
      </Box>
      <Box
        ref={(node: HTMLDivElement | null) => {
          localRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className="reader-html fade-up"
        lang="en"
        sx={{
          fontFamily: '"Literata Variable", "Iowan Old Style", Palatino, serif',
          fontSize,
          lineHeight,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Box>
  )
})
