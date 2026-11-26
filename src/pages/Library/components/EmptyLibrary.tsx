import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import { Box, Button, Typography } from '@mui/material'

export function EmptyLibrary({ onAdd }: { onAdd: () => void }) {
  return (
    <Box
      className="fade-up"
      sx={{
        py: { xs: 5, sm: 7 },
        px: 1,
        textAlign: 'center',
        maxWidth: 420,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          mx: 'auto',
          mb: 2.5,
          borderRadius: '22px',
          display: 'grid',
          placeItems: 'center',
          color: '#1f4d3a',
          background: 'linear-gradient(160deg, rgba(31,77,58,0.12), rgba(31,77,58,0.04))',
          border: '1px solid rgba(31,77,58,0.12)',
        }}
      >
        <AutoStoriesOutlinedIcon sx={{ fontSize: 34 }} />
      </Box>
      <Typography
        sx={{
          fontFamily: '"Literata Variable", Palatino, serif',
          fontWeight: 650,
          fontSize: '1.55rem',
          letterSpacing: '-0.02em',
          mb: 1,
        }}
      >
        Sua biblioteca está vazia
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.55 }}>
        Adicione um EPUB, PDF ou TXT em inglês. Depois é só pesquisar, filtrar e continuar a leitura.
      </Typography>
      <Button variant="contained" onClick={onAdd}>
        Adicionar livro
      </Button>
    </Box>
  )
}
