import { Box } from '@mui/material'
import { forwardRef, useLayoutEffect, useRef } from 'react'
import { applyBookmarkMark } from '../../../utils/readerDom.ts'

export const ReaderBody = forwardRef<
  HTMLDivElement,
  {
    html: string
    fontSize: number
    lineHeight: number
    bookmarkBlockIndex: number | null
  }
>(function ReaderBody({ html, fontSize, lineHeight, bookmarkBlockIndex }, ref) {
  const localRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const element = localRef.current
    if (!element) return
    applyBookmarkMark(element, bookmarkBlockIndex)
  }, [html, bookmarkBlockIndex])

  return (
    <Box
      ref={(node) => {
        localRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className="reader-html fade-up"
      lang="en"
      sx={{
        maxWidth: 680,
        mx: 'auto',
        px: 2.5,
        py: 3,
        fontFamily: '"Literata Variable", "Iowan Old Style", Palatino, serif',
        fontSize,
        lineHeight,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
