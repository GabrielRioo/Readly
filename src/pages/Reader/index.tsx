import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePreferences } from '../../hooks/usePreferences.ts'
import { useSpeech } from '../../hooks/useSpeech.ts'
import { saveVocabularyEntry } from '../../services/vocabularyStorage.ts'
import { nextReaderTheme, readerThemes } from '../../theme/readerThemes.ts'
import {
  clearLookupHighlight,
  highlightSelectionIn,
  promoteLookupToBookmark,
  scrollToBookmarkMark,
} from '../../utils/readerDom.ts'
import { formatPercent } from '../../utils/text.ts'
import { AudioBar } from './components/AudioBar.tsx'
import { ReaderBody } from './components/ReaderBody.tsx'
import { ReaderFooter } from './components/ReaderFooter.tsx'
import { ReaderToolbar } from './components/ReaderToolbar.tsx'
import { TranslationSheet } from './components/TranslationSheet.tsx'
import { useReaderDocument } from './hooks/useReaderDocument.ts'
import { useReadingScroll } from './hooks/useReadingScroll.ts'
import { useTextGestures } from './hooks/useTextGestures.ts'
import { useTextLookup } from './hooks/useTextLookup.ts'

export function ReaderPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { preferences, update } = usePreferences()
  const reader = useReaderDocument(bookId)
  const lookup = useTextLookup()
  const speech = useSpeech(preferences.speechRate, preferences.voiceURI)
  const theme = readerThemes[preferences.theme]
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const clearLookupRef = useRef(lookup.clear)
  clearLookupRef.current = lookup.clear
  const sectionKey = reader.section ? `${reader.book?.id ?? ''}:${reader.section.index}` : ''
  const scrollerRef = useReadingScroll(sectionKey, () => reader.ratioRef.current, (ratio) => {
    void reader.persistRatio(ratio)
  })

  const closeLookup = useCallback(() => {
    clearLookupHighlight(bodyRef.current)
    clearLookupRef.current()
  }, [])

  useTextGestures(scrollerRef, reader.status === 'ready', {
    onSelection: (text) => {
      const body = bodyRef.current
      if (body) highlightSelectionIn(body)
      lookup.lookup(text)
    },
  })

  const themeStyle = {
    background: theme.background,
    color: theme.text,
    '--reader-selection': theme.selection,
    '--reader-bookmark': theme.accent,
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
      <Box ref={scrollerRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
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
          onSave={() => {
            if (!lookup.request || !lookup.translation) return
            void saveVocabularyEntry({
              source: lookup.request.text,
              translation: lookup.translation,
              bookId: book.id,
              bookTitle: book.title,
            })
              .then(() => lookup.markSaved())
              .catch(() => undefined)
          }}
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
