import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePreferences } from '../../hooks/usePreferences.ts'
import { useSpeech } from '../../hooks/useSpeech.ts'
import {
  deleteVocabularyEntry,
  findVocabularyEntry,
  getVocabularyEntry,
  saveVocabularyEntry,
} from '../../services/vocabularyStorage.ts'
import { nextReaderTheme, readerThemes } from '../../theme/readerThemes.ts'
import type { ReaderNavigationState } from '../../types/readerNavigation.ts'
import type { VocabularyRecord } from '../../types/vocabulary.ts'
import { hasVocabularyLocation } from '../../types/vocabulary.ts'
import {
  clearLookupHighlight,
  getLookupMarkLocation,
  highlightSelectionIn,
  promoteLookupToBookmark,
  scrollToBookmarkMark,
  scrollToVocabularyMark,
  vocabularyIdFromTarget,
} from '../../utils/readerDom.ts'
import { formatPercent } from '../../utils/text.ts'
import { AudioBar } from './components/AudioBar.tsx'
import { ReaderBody } from './components/ReaderBody.tsx'
import { ReaderFooter } from './components/ReaderFooter.tsx'
import { ReaderToolbar } from './components/ReaderToolbar.tsx'
import { TranslationSheet } from './components/TranslationSheet.tsx'
import { useReaderDocument } from './hooks/useReaderDocument.ts'
import { useReadingScroll } from './hooks/useReadingScroll.ts'
import { useSectionVocabulary } from './hooks/useSectionVocabulary.ts'
import { useTextGestures } from './hooks/useTextGestures.ts'
import { useTextLookup } from './hooks/useTextLookup.ts'

export function ReaderPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { preferences, update } = usePreferences()
  const reader = useReaderDocument(bookId)
  const lookup = useTextLookup()
  const speech = useSpeech(preferences.speechRate, preferences.voiceURI)
  const theme = readerThemes[preferences.theme]
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const clearLookupRef = useRef(lookup.clear)
  clearLookupRef.current = lookup.clear
  const pendingFocusRef = useRef<ReaderNavigationState['focusVocabulary'] | null>(
    (location.state as ReaderNavigationState | null)?.focusVocabulary ?? null,
  )
  const focusHandledRef = useRef(false)
  const ignoreSelectionRef = useRef(false)
  const sectionKey = reader.section ? `${reader.book?.id ?? ''}:${reader.section.index}` : ''
  const vocabulary = useSectionVocabulary(reader.book?.id, reader.section?.index)
  const scrollerRef = useReadingScroll(sectionKey, () => reader.ratioRef.current, (ratio) => {
    void reader.persistRatio(ratio)
  })

  const closeLookup = useCallback(() => {
    clearLookupHighlight(bodyRef.current)
    clearLookupRef.current()
  }, [])

  useEffect(() => {
    if (!(location.state as ReaderNavigationState | null)?.focusVocabulary) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useTextGestures(scrollerRef, reader.status === 'ready', {
    onSelection: (text) => {
      if (ignoreSelectionRef.current) {
        ignoreSelectionRef.current = false
        return
      }
      const body = bodyRef.current
      const book = reader.book
      if (body) highlightSelectionIn(body)
      if (!book) {
        lookup.lookup(text)
        return
      }
      void findVocabularyEntry(book.id, text).then((entry) => {
        if (entry) lookup.lookup(text, { saved: true, entryId: entry.id })
        else lookup.lookup(text)
      })
    },
  })

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || reader.status !== 'ready') return

    const openEntry = (entryId: string) => {
      ignoreSelectionRef.current = true
      window.getSelection()?.removeAllRanges()
      clearLookupHighlight(bodyRef.current)
      const entry = vocabulary.entries.find((item) => item.id === entryId)
      if (entry) {
        lookup.openSaved(entry)
        return
      }
      void getVocabularyEntry(entryId).then((found) => {
        if (found) lookup.openSaved(found)
      })
    }

    const onPointerDown = (event: PointerEvent) => {
      if (vocabularyIdFromTarget(event.target)) ignoreSelectionRef.current = true
    }

    const onClick = (event: MouseEvent) => {
      const entryId = vocabularyIdFromTarget(event.target)
      if (!entryId) return
      event.preventDefault()
      openEntry(entryId)
    }

    scroller.addEventListener('pointerdown', onPointerDown)
    scroller.addEventListener('click', onClick)
    return () => {
      scroller.removeEventListener('pointerdown', onPointerDown)
      scroller.removeEventListener('click', onClick)
    }
  }, [lookup, reader.status, scrollerRef, vocabulary.entries])

  useEffect(() => {
    const focus = pendingFocusRef.current
    if (!focus || !reader.book || !reader.section || reader.sectionStatus !== 'ready') return
    if (focusHandledRef.current) return

    if (reader.section.index !== focus.sectionIndex) {
      void reader.goTo(focus.sectionIndex)
      return
    }

    if (vocabulary.status !== 'ready') return

    focusHandledRef.current = true
    pendingFocusRef.current = null

    let cancelled = false
    const timer = window.setTimeout(() => {
      void getVocabularyEntry(focus.entryId).then((entry) => {
        if (cancelled || !entry) return
        const scroller = scrollerRef.current
        const body = bodyRef.current
        if (scroller && body) scrollToVocabularyMark(scroller, body, entry.id)
        lookup.openSaved(entry)
        if (scroller) {
          const max = scroller.scrollHeight - scroller.clientHeight
          const ratio = max <= 0 ? 1 : scroller.scrollTop / max
          void reader.persistRatio(ratio)
        }
      })
    }, 40)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    lookup,
    reader,
    reader.book,
    reader.section,
    reader.sectionStatus,
    scrollerRef,
    vocabulary.entries,
    vocabulary.status,
  ])

  const themeStyle = {
    background: theme.background,
    color: theme.text,
    '--reader-selection': theme.selection,
    '--reader-bookmark': theme.accent,
    '--reader-vocab': theme.vocab,
  }

  if (reader.status === 'loading') {
    return (
      <Box className="reader-surface" sx={{ ...themeStyle, minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (reader.status === 'error' || !reader.book || !reader.section) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Não abriu.
        </Typography>
        <Typography sx={{ mb: 2 }}>{reader.error ?? 'Livro indisponível.'}</Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Voltar
        </Button>
      </Box>
    )
  }

  const book = reader.book
  const section = reader.section
  const sheetOpen = lookup.request !== null
  const sectionBookmark =
    book.bookmark &&
    book.bookmark.sectionIndex === section.index &&
    typeof book.bookmark.startOffset === 'number'
      ? book.bookmark
      : null
  const selectionBookmarked = Boolean(
    lookup.request &&
      sectionBookmark &&
      sectionBookmark.quote === lookup.request.text &&
      sectionBookmark.length > 0,
  )
  const focusVocabularyId =
    lookup.request?.origin === 'vocabulary' ? lookup.entryId : pendingFocusRef.current?.entryId

  function toggleChapterAudio() {
    if (speech.status === 'playing') speech.pause()
    else if (speech.status === 'paused') speech.resume()
    else void speech.speak(section.text)
  }

  function moveTo(index: number) {
    speech.stop()
    closeLookup()
    void reader.goTo(index)
  }

  function toggleBookmark() {
    const scroller = scrollerRef.current
    const body = bodyRef.current
    if (!body) return

    if (selectionBookmarked) {
      void reader.setBookmark(null)
      return
    }

    const placed = promoteLookupToBookmark(body)
    if (!placed) return
    void reader.setBookmark(placed)
    if (scroller) {
      scrollToBookmarkMark(scroller, body)
      const max = scroller.scrollHeight - scroller.clientHeight
      const ratio = max <= 0 ? 1 : scroller.scrollTop / max
      void reader.persistRatio(ratio)
    }
  }

  async function toggleSave() {
    if (!lookup.request || !lookup.translation) return

    if (lookup.saved) {
      const id = lookup.entryId ?? (await findVocabularyEntry(book.id, lookup.request.text))?.id
      if (!id) {
        lookup.markUnsaved()
        return
      }
      await deleteVocabularyEntry(id)
      vocabulary.removeLocal(id)
      lookup.markUnsaved()
      if (lookup.request.origin === 'vocabulary') closeLookup()
      return
    }

    const body = bodyRef.current
    const fromMark = body ? getLookupMarkLocation(body) : null
    const existing = vocabulary.entries.find((entry) => entry.id === lookup.entryId)
    const location = fromMark
      ? {
          sectionIndex: section.index,
          startOffset: fromMark.startOffset,
          length: fromMark.length,
        }
      : existing && hasVocabularyLocation(existing)
        ? {
            sectionIndex: existing.sectionIndex,
            startOffset: existing.startOffset,
            length: existing.length,
          }
        : undefined

    try {
      const saved: VocabularyRecord = await saveVocabularyEntry({
        source: lookup.request.text,
        translation: lookup.translation,
        bookId: book.id,
        bookTitle: book.title,
        location,
      })
      clearLookupHighlight(body)
      vocabulary.upsertLocal(saved)
      lookup.markSaved(saved.id)
    } catch {
      // ignore save failures for personal offline use
    }
  }

  return (
    <Box
      className="reader-surface"
      sx={{ ...themeStyle, height: '100dvh', display: 'flex', flexDirection: 'column' }}
    >
      <ReaderToolbar
        title={book.title}
        theme={theme}
        playing={speech.status === 'playing'}
        onBack={() => {
          speech.stop()
          navigate('/')
        }}
        onToggleSpeech={toggleChapterAudio}
        onTheme={() => update({ theme: nextReaderTheme(preferences.theme) })}
      />
      <Box
        ref={scrollerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {reader.sectionStatus === 'loading' && (
          <Typography sx={{ px: 2.5, pt: 2, color: theme.muted }}>Abrindo trecho…</Typography>
        )}
        {reader.error && (
          <Typography sx={{ px: 2.5, pt: 2 }} color="error">
            {reader.error}
          </Typography>
        )}
        <ReaderBody
          ref={bodyRef}
          html={section.html}
          fontSize={preferences.fontSize}
          lineHeight={preferences.lineHeight}
          bookmark={sectionBookmark}
          vocabulary={vocabulary.entries}
          focusVocabularyId={focusVocabularyId}
        />
      </Box>
      {speech.error && (
        <Alert severity="warning" onClose={speech.clearError} sx={{ mx: 1.5, mb: 1 }}>
          {speech.error}
        </Alert>
      )}
      {speech.status !== 'idle' && (
        <AudioBar
          theme={theme}
          index={speech.index}
          total={speech.total}
          rate={preferences.speechRate}
          paused={speech.status === 'paused'}
          onPause={speech.pause}
          onResume={speech.resume}
          onStop={speech.stop}
          onRate={(rate) => update({ speechRate: rate })}
        />
      )}
      {sheetOpen && lookup.request && (
        <TranslationSheet
          theme={theme}
          translation={lookup.translation}
          meanings={lookup.meanings}
          status={lookup.status}
          error={lookup.error}
          saved={lookup.saved}
          bookmarked={selectionBookmarked}
          onClose={closeLookup}
          onBookmark={toggleBookmark}
          onSpeak={() => void speech.speak(lookup.request?.text ?? '')}
          onSave={() => void toggleSave()}
        />
      )}
      <ReaderFooter
        theme={theme}
        progressLabel={formatPercent(book.progress)}
        fontSize={preferences.fontSize}
        canPrev={section.index > 0}
        canNext={section.index < book.sectionCount - 1}
        titles={book.sectionTitles}
        sectionIndex={section.index}
        sectionCount={book.sectionCount}
        onFont={(size) => update({ fontSize: size })}
        onPrev={() => moveTo(section.index - 1)}
        onNext={() => moveTo(section.index + 1)}
        onPick={moveTo}
      />
    </Box>
  )
}
