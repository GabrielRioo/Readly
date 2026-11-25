import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'
import type { LookupRequest } from '../hooks/useTextLookup.ts'

export function TranslationSheet({
  theme,
  request,
  translation,
  status,
  error,
  saved,
  onClose,
  onSave,
  onSpeak,
}: {
  theme: ReaderTheme
  request: LookupRequest
  translation: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  saved: boolean
  onClose: () => void
  onSave: () => void
  onSpeak: () => void
}) {
  return (
    <Box
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
          {request.origin === 'hover' ? 'Palavra' : 'Seleção'} · inglês → português
        </Typography>
        <IconButton aria-label="Fechar tradução" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      {status === 'loading' && <CircularProgress size={22} />}
      {status === 'error' && <Typography color="error">{error}</Typography>}
      {status === 'ready' && translation && (
        <Typography sx={{ fontSize: 18, mb: 1.5 }}>{translation}</Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onSpeak} sx={{ color: 'inherit', borderColor: 'currentColor' }}>
          Ouvir
        </Button>
        <Button variant="contained" disabled={status !== 'ready' || saved} onClick={onSave}>
          {saved ? 'Salvo' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  )
}
