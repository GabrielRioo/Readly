import { Box, IconButton, Typography } from '@mui/material'
import { useState } from 'react'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'

export function ReaderFooter({
  theme,
  progressLabel,
  fontSize,
  canPrev,
  canNext,
  titles,
  sectionIndex,
  sectionCount,
  onFont,
  onPrev,
  onNext,
  onPick,
}: {
  theme: ReaderTheme
  progressLabel: string
  fontSize: number
  canPrev: boolean
  canNext: boolean
  titles: string[]
  sectionIndex: number
  sectionCount: number
  onFont: (size: number) => void
  onPrev: () => void
  onNext: () => void
  onPick: (index: number) => void
}) {
  return (
    <Box
      component="footer"
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        pb: 'calc(6px + env(safe-area-inset-bottom))',
        minHeight: 48,
        borderTop: `1px solid ${theme.muted}33`,
        background: theme.background,
        color: theme.text,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <IconButton aria-label="Diminuir texto" size="small" onClick={() => onFont(fontSize - 1)} sx={{ color: theme.text }}>
        <Typography sx={{ fontSize: 14 }}>A−</Typography>
      </IconButton>
      <IconButton aria-label="Aumentar texto" size="small" onClick={() => onFont(fontSize + 1)} sx={{ color: theme.text }}>
        <Typography sx={{ fontSize: 18 }}>A+</Typography>
      </IconButton>
      <IconButton aria-label="Trecho anterior" size="small" disabled={!canPrev} onClick={onPrev} sx={{ color: theme.text }}>
        <Typography>‹</Typography>
      </IconButton>
      {titles.length > 0 ? (
        <Box
          component="select"
          aria-label="Ir para trecho"
          value={sectionIndex}
          onChange={(event) => onPick(Number(event.target.value))}
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 36,
            border: 0,
            background: 'transparent',
            color: theme.text,
          }}
        >
          {titles.map((title, index) => (
            <option key={`${title}-${index}`} value={index}>
              {title}
            </option>
          ))}
        </Box>
      ) : (
        <PageField key={sectionIndex} page={sectionIndex + 1} max={sectionCount} theme={theme} onPick={onPick} />
      )}
      <Typography variant="body2" sx={{ color: theme.muted, px: 0.5, flexShrink: 0 }}>
        {titles.length > 0 ? `${sectionIndex + 1} · ${progressLabel}` : progressLabel}
      </Typography>
      <IconButton aria-label="Próximo trecho" size="small" disabled={!canNext} onClick={onNext} sx={{ color: theme.text }}>
        <Typography>›</Typography>
      </IconButton>
    </Box>
  )
}

function PageField({
  page,
  max,
  theme,
  onPick,
}: {
  page: number
  max: number
  theme: ReaderTheme
  onPick: (index: number) => void
}) {
  const [draft, setDraft] = useState(String(page))

  function commit() {
    const next = Number(draft)
    if (!Number.isInteger(next)) return
    onPick(next - 1)
  }

  return (
    <Box
      component="input"
      aria-label={`Página, de 1 a ${max}`}
      inputMode="numeric"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit()
      }}
      sx={{
        width: 48,
        minHeight: 36,
        textAlign: 'center',
        border: 0,
        background: 'transparent',
        color: theme.text,
        flexShrink: 0,
      }}
    />
  )
}
