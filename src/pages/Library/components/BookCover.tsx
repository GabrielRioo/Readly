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
        boxShadow: '0 10px 24px rgba(26, 31, 28, 0.18), -2px 0 0 rgba(0,0,0,0.14)',
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
            objectFit: 'cover',
            objectPosition: 'center',
            // Crop white page margins common on PDF cover renders.
            transform: 'scale(1.08)',
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

      {showMeta && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            px: 1.1,
            pt: 4,
            pb: 1.1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.9) 100%)',
            color: '#fff',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Literata Variable", Palatino, serif',
              fontWeight: 650,
              fontSize: '0.92rem',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 2px rgba(0,0,0,0.45)',
            }}
          >
            {title}
          </Typography>
          {typeof progress === 'number' && (
            <Typography
              sx={{
                mt: 0.35,
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              {formatPercent(progress)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
