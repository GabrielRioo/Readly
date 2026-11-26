import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { BookSummary } from '../../../types/book.ts'
import { formatPercent } from '../../../utils/text.ts'
import { BookCover } from './BookCover.tsx'

export function BookList({
  books,
  onEdit,
  onDelete,
}: {
  books: BookSummary[]
  onEdit: (book: BookSummary) => void
  onDelete: (book: BookSummary) => void
}) {
  const navigate = useNavigate()

  return (
    <Box
      component="ul"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(3, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: 2, sm: 2.5 },
      }}
    >
      {books.map((book) => (
        <Box component="li" key={book.id} className="fade-up" sx={{ position: 'relative', minWidth: 0 }}>
          <Box
            component="button"
            type="button"
            onClick={() => navigate(`/read/${book.id}`)}
            aria-label={`Abrir ${book.title}, ${formatPercent(book.progress)} lido`}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              borderRadius: 1,
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 3,
              },
            }}
          >
            <BookCover
              title={book.title}
              format={book.format}
              coverBlob={book.coverBlob}
              progress={book.progress}
              showMeta
            />
          </Box>
          <Box sx={{ position: 'absolute', top: 6, right: 6, display: 'grid', gap: 0.5 }}>
            <IconButton
              aria-label={`Editar ${book.title}`}
              onClick={() => onEdit(book)}
              size="small"
              sx={actionButtonSx}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              aria-label={`Excluir ${book.title}`}
              onClick={() => onDelete(book)}
              size="small"
              sx={actionButtonSx}
            >
              <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const actionButtonSx = {
  width: 34,
  height: 34,
  bgcolor: 'rgba(20,20,20,0.55)',
  color: '#fff',
  backdropFilter: 'blur(4px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  '&:hover': { bgcolor: 'rgba(20,20,20,0.72)' },
} as const
