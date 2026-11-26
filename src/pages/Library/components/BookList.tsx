import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { useState } from 'react'
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
  const [menuBook, setMenuBook] = useState<BookSummary | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  return (
    <>
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(3, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: { xs: 1.25, sm: 1.75 },
          columnGap: { xs: 1.1, sm: 1.5 },
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
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
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
            <IconButton
              aria-label={`Opções de ${book.title}`}
              size="small"
              onClick={(event) => {
                setMenuBook(book)
                setMenuAnchor(event.currentTarget)
              }}
              sx={{
                position: 'absolute',
                top: 4,
                right: 2,
                width: 30,
                height: 30,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor) && Boolean(menuBook)}
        onClose={() => {
          setMenuAnchor(null)
          setMenuBook(null)
        }}
      >
        <MenuItem
          onClick={() => {
            if (!menuBook) return
            onEdit(menuBook)
            setMenuAnchor(null)
            setMenuBook(null)
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuBook) return
            onDelete(menuBook)
            setMenuAnchor(null)
            setMenuBook(null)
          }}
        >
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
