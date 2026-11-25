import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ContrastIcon from '@mui/icons-material/Contrast'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { Box, IconButton, Typography } from '@mui/material'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'

export function ReaderToolbar({
  title,
  theme,
  playing,
  onBack,
  onToggleSpeech,
  onTheme,
}: {
  title: string
  theme: ReaderTheme
  playing: boolean
  onBack: () => void
  onToggleSpeech: () => void
  onTheme: () => void
}) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.5,
        pt: 'env(safe-area-inset-top)',
        borderBottom: `1px solid ${theme.muted}33`,
        background: theme.background,
      }}
    >
      <IconButton aria-label="Voltar à biblioteca" onClick={onBack} sx={{ color: theme.text }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography sx={{ flex: 1, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </Typography>
      <IconButton aria-label={playing ? 'Pausar áudio' : 'Ouvir este trecho'} onClick={onToggleSpeech} sx={{ color: theme.accent }}>
        {playing ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <IconButton aria-label={`Tema ${theme.label}. Trocar tema de leitura.`} onClick={onTheme} sx={{ color: theme.text }}>
        <ContrastIcon />
      </IconButton>
    </Box>
  )
}
