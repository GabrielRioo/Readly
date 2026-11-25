import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { usePreferences } from '../../hooks/usePreferences.ts'
import { useSpeech } from '../../hooks/useSpeech.ts'
import { saveVocabularyEntry } from '../../services/vocabularyStorage.ts'
import { nextReaderTheme, readerThemes } from '../../theme/readerThemes.ts'
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
  const sectionKey = reader.section ? `${reader.book?.id ?? ''}:${reader.section.index}` : ''
  const scrollerRef = useReadingScroll(sectionKey, () => reader.ratioRef.current, (ratio) => {
    void reader.persistRatio(ratio)
  })

  useTextGestures(scrollerRef, reader.status === 'ready', {
    onHover: (word) => {
      const selected = window.getSelection()?.toString().trim()
      if (selected) return
      lookup.lookup(word, 'hover')
    },
    onSelection: (text) => lookup.lookup(text, 'selection'),
  })

  const themeStyle = {
    background: theme.background,
    color: theme.text,
    '--reader-selection': theme.selection,
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

  function toggleChapterAudio() {
    if (speech.status === 'playing') speech.pause()
    else if (speech.status === 'paused') speech.resume()
    else void speech.speak(section.text)
  }

  function moveTo(index: number) {
    speech.stop()
    lookup.clear()
    void reader.goTo(index)
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
        sx={{ flex: 1, overflow: 'auto', pb: sheetOpen ? '42vh' : 0 }}
      >
        {reader.sectionStatus === 'loading' && (
          <Typography sx={{ px: 2.5, pt: 2, color: theme.muted }}>Abrindo trecho…</Typography>
        )}
        {reader.error && (
          <Typography sx={{ px: 2.5, pt: 2 }} color="error">
            {reader.error}
          </Typography>
        )}
        <ReaderBody html={section.html} fontSize={preferences.fontSize} lineHeight={preferences.lineHeight} />
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
      <ReaderFooter
        theme={theme}
        label={`${section.title} · ${formatPercent(book.progress)}`}
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
      {lookup.request && (
        <TranslationSheet
          theme={theme}
          request={lookup.request}
          translation={lookup.translation}
          status={lookup.status}
          error={lookup.error}
          saved={lookup.saved}
          onClose={lookup.clear}
          onSpeak={() => void speech.speak(lookup.request?.text ?? '')}
          onSave={() => {
            if (!lookup.request || !lookup.translation) return
            void saveVocabularyEntry({
              source: lookup.request.text,
              translation: lookup.translation,
              bookId: book.id,
              bookTitle: book.title,
            }).then(() => lookup.markSaved()).catch(() => undefined)
          }}
        />
      )}
    </Box>
  )
}
