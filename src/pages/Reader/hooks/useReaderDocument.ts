import { useEffect, useRef, useState } from 'react'
import { saveReadingBookmark, saveReadingLocation } from '../../../services/bookStorage.ts'
import { closeReaderBook, isReaderCancelled, loadReaderSection, openReaderBook } from '../../../services/readerService.ts'
import type { OpenedReader, ReadingBookmark, ReaderSection } from '../../../types/book.ts'
import { errorMessage, readingProgress } from '../../../utils/text.ts'

export function useReaderDocument(bookId: string | undefined) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [sectionStatus, setSectionStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [book, setBook] = useState<OpenedReader | null>(null)
  const [section, setSection] = useState<ReaderSection | null>(null)
  const [activeId, setActiveId] = useState(bookId)
  const ratioRef = useRef(0)

  if (bookId !== activeId) {
    setActiveId(bookId)
    setStatus('loading')
    setSectionStatus('loading')
    setError(null)
    setBook(null)
    setSection(null)
  }

  useEffect(() => {
    if (!bookId) return
    let active = true

    openReaderBook(bookId)
      .then((opened) => {
        if (!active) return
        ratioRef.current = opened.location.scrollRatio
        setBook(opened)
        setSection(opened.section)
        setStatus('ready')
        setSectionStatus('ready')
      })
      .catch((caught: unknown) => {
        if (!active || isReaderCancelled(caught)) return
        setError(errorMessage(caught, 'Não foi possível abrir o livro.'))
        setStatus('error')
      })

    return () => {
      active = false
      closeReaderBook(bookId)
    }
  }, [bookId])

  async function goTo(index: number) {
    if (!bookId || !book) return
    setSectionStatus('loading')
    setError(null)
    try {
      const next = await loadReaderSection(bookId, index)
      ratioRef.current = 0
      const location = { chapterIndex: next.index, page: next.index + 1, scrollRatio: 0 }
      const progress = readingProgress(book.sectionCount, next.index, 0)
      setSection(next)
      setBook((current) => (current ? { ...current, location, progress } : current))
      setSectionStatus('ready')
      await saveReadingLocation(bookId, location, progress)
    } catch (caught) {
      if (isReaderCancelled(caught)) return
      setSectionStatus('error')
      setError(errorMessage(caught, 'Não foi possível abrir este trecho.'))
    }
  }

  async function persistRatio(ratio: number) {
    if (!book || !section) return
    ratioRef.current = ratio
    const progress = readingProgress(book.sectionCount, section.index, ratio)
    setBook((current) => (current ? { ...current, progress } : current))
    await saveReadingLocation(
      book.id,
      { chapterIndex: section.index, page: section.index + 1, scrollRatio: ratio },
      progress,
    )
  }

  async function setBookmark(
    input: { startOffset: number; length: number; quote: string } | null,
  ) {
    if (!book || !section) return
    const bookmark: ReadingBookmark | null =
      input === null
        ? null
        : {
            sectionIndex: section.index,
            startOffset: input.startOffset,
            length: input.length,
            quote: input.quote,
            updatedAt: Date.now(),
          }
    setBook((current) => (current ? { ...current, bookmark } : current))
    await saveReadingBookmark(book.id, bookmark)
  }

  return { status, sectionStatus, error, book, section, ratioRef, goTo, persistRatio, setBookmark }
}
