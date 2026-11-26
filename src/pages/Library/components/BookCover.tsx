import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { usePreferences } from '../../../hooks/usePreferences.ts'
import type { BookFormat } from '../../../types/book.ts'

const formatTone: Record<BookFormat, { from: string; to: string }> = {
  epub: { from: '#1f4d3a', to: '#2f6b52' },
  pdf: { from: '#3d4f5f', to: '#5a7186' },
  txt: { from: '#6b5a3e', to: '#8a7350' },
}

const kindleTone: Record<BookFormat, { from: string; to: string }> = {
  epub: { from: '#2a2a2a', to: '#4a4a4a' },
  pdf: { from: '#333333', to: '#555555' },
  txt: { from: '#3a3a3a', to: '#5c5c5c' },
}

export function BookCover({
  title,
  format,
  coverBlob,
}: {
  title: string
  format: BookFormat
  coverBlob?: Blob | null
}) {
  const { preferences } = usePreferences()
  const [url, setUrl] = useState<string | null>(null)
  const tone = preferences.theme === 'kindle' ? kindleTone[format] : formatTone[format]
  const initial = title.trim().slice(0, 1).toUpperCase() || 'R'

  useEffect(() => {
    if (!coverBlob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(coverBlob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [coverBlob])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '2 / 3',
        borderRadius: '4px 10px 10px 4px',
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${tone.from}, ${tone.to})`,
        boxShadow:
          '0 10px 24px rgba(26, 31, 28, 0.16), 0 1px 0 rgba(255,255,255,0.2) inset, -3px 0 0 rgba(0,0,0,0.12)',
      }}
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <Box
          sx={{
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            px: 1.5,
            color: 'rgba(255,255,255,0.92)',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Literata Variable", Palatino, serif',
                fontSize: '2rem',
                fontWeight: 650,
                lineHeight: 1,
                mb: 1,
              }}
            >
              {initial}
            </Typography>
            <MenuBookOutlinedIcon sx={{ opacity: 0.7, fontSize: 22 }} />
          </Box>
        </Box>
      )}
    </Box>
  )
}
