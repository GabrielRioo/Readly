import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { usePreferences } from '../../../hooks/usePreferences.ts'
import type { BookFormat } from '../../../types/book.ts'
import { formatPercent } from '../../../utils/text.ts'

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
  progress,
  showMeta = false,
}: {
  title: string
  format: BookFormat
  coverBlob?: Blob | null
  progress?: number
  showMeta?: boolean
}) {
  const { preferences } = usePreferences()
  const [url, setUrl] = useState<string | null>(null)
  const kindle = preferences.theme === 'kindle'
  const tone = kindle ? kindleTone[format] : formatTone[format]
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
        borderRadius: '2px',
        overflow: 'hidden',
        background: url ? '#111' : `linear-gradient(160deg, ${tone.from}, ${tone.to})`,
        boxShadow: kindle ? '0 1px 0 rgba(0,0,0,0.2)' : '0 8px 18px rgba(0, 0, 0, 0.22)',
        border: 0,
        outline: 0,
        isolation: 'isolate',
      }}
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
            border: 0,
            filter: kindle ? 'grayscale(1) contrast(1.05)' : 'none',
          }}
        />
      ) : (
        <Box
          sx={{
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            px: 1,
            color: 'rgba(255,255,255,0.92)',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, mb: 0.75 }}>
              {initial}
            </Typography>
            <MenuBookOutlinedIcon sx={{ opacity: 0.7, fontSize: 18 }} />
          </Box>
        </Box>
      )}

      {showMeta && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            px: 0.85,
            pt: 3.25,
            pb: 0.85,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 48%, rgba(0,0,0,0.94) 100%)',
            color: '#fff',
          }}
        >
          <Typography
            sx={{
              fontWeight: 650,
              fontSize: '0.78rem',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </Typography>
          {typeof progress === 'number' && (
            <Typography sx={{ mt: 0.25, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
              {formatPercent(progress)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
