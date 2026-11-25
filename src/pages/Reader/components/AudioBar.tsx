import { Box, Button, Typography } from '@mui/material'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'
import type { PreferencesRecord } from '../../../types/preferences.ts'

const rates = [0.75, 1, 1.25, 1.5]

export function AudioBar({
  theme,
  index,
  total,
  rate,
  paused,
  onPause,
  onResume,
  onStop,
  onRate,
}: {
  theme: ReaderTheme
  index: number
  total: number
  rate: number
  paused: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRate: (rate: PreferencesRecord['speechRate']) => void
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        px: 1.5,
        py: 1,
        overflow: 'auto',
        borderTop: `1px solid ${theme.muted}33`,
        background: theme.background,
        color: theme.text,
      }}
    >
      <Button onClick={paused ? onResume : onPause} sx={{ color: theme.accent, minWidth: 88 }}>
        {paused ? 'Continuar' : 'Pausar'}
      </Button>
      <Button onClick={onStop} sx={{ color: theme.text }}>
        Parar
      </Button>
      <Typography variant="body2" sx={{ color: theme.muted, whiteSpace: 'nowrap' }}>
        {total > 0 ? `${index + 1}/${total}` : ''}
      </Typography>
      {rates.map((value) => (
        <Button
          key={value}
          aria-pressed={rate === value}
          onClick={() => onRate(value)}
          sx={{ color: rate === value ? theme.accent : theme.muted, minWidth: 52 }}
        >
          {value}x
        </Button>
      ))}
    </Box>
  )
}
