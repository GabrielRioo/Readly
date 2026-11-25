import { Box, IconButton, Typography } from '@mui/material'
import { useState } from 'react'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'

export function ReaderFooter({
  theme,
  label,
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
  label: string
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
        px: 1.5,
        pt: 1,
        pb: 'calc(10px + env(safe-area-inset-bottom))',
        borderTop: `1px solid ${theme.muted}33`,
        background: theme.background,
        color: theme.text,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton aria-label="Diminuir texto" onClick={() => onFont(fontSize - 1)} sx={{ color: theme.text }}>
          <Typography sx={{ fontSize: 14 }}>A−</Typography>
        </IconButton>
        <IconButton aria-label="Aumentar texto" onClick={() => onFont(fontSize + 1)} sx={{ color: theme.text }}>
          <Typography sx={{ fontSize: 18 }}>A+</Typography>
        </IconButton>
        <IconButton aria-label="Trecho anterior" disabled={!canPrev} onClick={onPrev} sx={{ color: theme.text }}>
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
              minHeight: 44,
              border: 0,
              background: 'transparent',
              color: theme.text,
              maxWidth: '100%',
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
        <IconButton aria-label="Próximo trecho" disabled={!canNext} onClick={onNext} sx={{ color: theme.text }}>
          <Typography>›</Typography>
        </IconButton>
      </Box>
      <Typography variant="body2" sx={{ color: theme.muted, px: 1, pb: 0.5 }}>
        {label}. Selecione para traduzir ou passe o mouse sobre a palavra.
      </Typography>
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
        width: 72,
        minHeight: 44,
        textAlign: 'center',
        border: 0,
        background: 'transparent',
        color: theme.text,
      }}
    />
  )
}
