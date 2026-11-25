import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'

export function TranslationSheet({
  theme,
  translation,
  meanings,
  status,
  error,
  saved,
  bookmarked,
  onClose,
  onSave,
  onSpeak,
  onBookmark,
}: {
  theme: ReaderTheme
  translation: string | null
  meanings: string[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  saved: boolean
  bookmarked: boolean
  onClose: () => void
  onSave: () => void
  onSpeak: () => void
  onBookmark: () => void
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const showMeanings = meanings.length > 1

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (sheetRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('.reader-lookup-mark, .reader-bookmark-mark')) return
      onClose()
    }

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  return (
    <Box
      ref={sheetRef}
      className="translation-sheet"
      role="dialog"
      aria-label="Tradução"
      sx={{
        flexShrink: 0,
        maxHeight: '40vh',
        overflow: 'auto',
        px: 2,
        pt: 1.5,
        pb: 1.5,
        borderRadius: '18px 18px 0 0',
        background: theme.sheet,
        color: theme.id === 'black' ? theme.text : '#1a1f1c',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ flex: 1, opacity: 0.7 }}>
          {showMeanings ? 'Palavra · significados' : 'Seleção · inglês → português'}
        </Typography>
        <IconButton aria-label="Fechar tradução" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      {status === 'loading' && <CircularProgress size={22} />}
      {status === 'error' && <Typography color="error">{error}</Typography>}
      {status === 'ready' && translation && !showMeanings && (
        <Typography sx={{ fontSize: 18, mb: 1.5 }}>{translation}</Typography>
      )}
      {status === 'ready' && showMeanings && (
        <Box component="ul" sx={{ m: 0, mb: 1.5, pl: 2.25 }}>
          {meanings.map((meaning) => (
            <Typography key={meaning} component="li" sx={{ fontSize: 17, mb: 0.5 }}>
              {meaning}
            </Typography>
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onSpeak} sx={{ color: 'inherit', borderColor: 'currentColor' }}>
          Ouvir
        </Button>
        <Button
          variant="outlined"
          onClick={onBookmark}
          startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          sx={{ color: 'inherit', borderColor: 'currentColor' }}
        >
          {bookmarked ? 'Marcado' : 'Marcar'}
        </Button>
        <Button variant="contained" disabled={status !== 'ready' || saved} onClick={onSave}>
          {saved ? 'Salvo' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  )
}
