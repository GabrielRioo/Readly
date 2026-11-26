import { Box, Typography } from '@mui/material'

export function ReadlyWordmark() {
  return (
    <Box
      component="h1"
      aria-label="Readly"
      sx={{
        m: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{ width: 16, height: 16, display: 'currentColor' }}
        >
          <path d="M5 4.5h9.2c2.2 0 4 1.5 4 3.7V19H9.4c-2.2 0-4.4.7-4.4 3.2V4.5Z" fill="currentColor" opacity="0.92" />
          <path
            d="M8.2 8.2h7.2M8.2 11h5.8M8.2 13.8h4.2"
            stroke="primary.main"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            style={{ stroke: 'var(--readly-mark-lines, #fff)' }}
          />
        </Box>
      </Box>
      <Typography
        component="span"
        sx={{
          fontFamily: '"Literata Variable", Palatino, Georgia, serif',
          fontWeight: 650,
          fontSize: { xs: '1.85rem', sm: '2.1rem' },
          letterSpacing: '-0.045em',
          lineHeight: 1,
          color: 'primary.main',
        }}
      >
        Readly
      </Typography>
    </Box>
  )
}
