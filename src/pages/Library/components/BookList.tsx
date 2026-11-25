import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Button, IconButton, LinearProgress, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { BookSummary } from '../../../types/book.ts'
import { formatFileSize, formatPercent } from '../../../utils/text.ts'

const formatLabel = { epub: 'EPUB', pdf: 'PDF', txt: 'TXT' }

export function BookList({ books, onDelete }: { books: BookSummary[]; onDelete: (book: BookSummary) => void }) {
  const navigate = useNavigate()

  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
      {books.map((book) => (
        <Box
          component="li"
          key={book.id}
          className="fade-up"
          sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}
        >
          <Button
            onClick={() => navigate(`/read/${book.id}`)}
            sx={{
              flex: 1,
              justifyContent: 'flex-start',
              textAlign: 'left',
              px: 1.5,
              py: 1.25,
              color: 'text.primary',
              background: 'rgba(255,255,255,0.55)',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography sx={{ fontWeight: 650 }}>{book.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatLabel[book.format]} · {formatFileSize(book.size)} · {formatPercent(book.progress)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.round(book.progress * 100)}
                aria-label={`Progresso de ${book.title}`}
                sx={{ mt: 1, height: 4, borderRadius: 99, backgroundColor: 'rgba(31,77,58,0.12)' }}
              />
            </Box>
          </Button>
          <IconButton aria-label={`Excluir ${book.title}`} onClick={() => onDelete(book)}>
            <DeleteOutlinedIcon />
          </IconButton>
        </Box>
      ))}
    </Box>
  )
}
