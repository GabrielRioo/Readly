import { Box } from '@mui/material'
import { forwardRef, useLayoutEffect, useRef } from 'react'
import type { ReadingBookmark } from '../../../types/book.ts'
import { applyBookmarkByOffset, clearBookmarkMark } from '../../../utils/readerDom.ts'

export const ReaderBody = forwardRef<
  HTMLDivElement,
  {
    html: string
    fontSize: number
    lineHeight: number
    bookmark: ReadingBookmark | null
  }
>(function ReaderBody({ html, fontSize, lineHeight, bookmark }, ref) {
  const localRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const element = localRef.current
    if (!element) return
    if (!bookmark || typeof bookmark.startOffset !== 'number' || bookmark.length <= 0) {
      clearBookmarkMark(element)
      return
    }
    applyBookmarkByOffset(element, bookmark.startOffset, bookmark.length)
  }, [html, bookmark])

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
