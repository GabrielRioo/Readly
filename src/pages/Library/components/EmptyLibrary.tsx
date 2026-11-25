import { Box, Button, Typography } from '@mui/material'

export function EmptyLibrary({ onAdd }: { onAdd: () => void }) {
  return (
    <Box className="fade-up" sx={{ py: 6 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Nenhum livro ainda.
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 420 }}>
        Envie um EPUB, PDF ou TXT em inglês. Ele fica só neste aparelho.
      </Typography>
      <Button variant="contained" onClick={onAdd}>
        Adicionar livro
      </Button>
    </Box>
  )
}
