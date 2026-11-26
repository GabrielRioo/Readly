import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { BookSummary } from '../../../types/book.ts'
import { prepareCoverImage } from '../../../services/coverService.ts'
import { BookCover } from './BookCover.tsx'

export function EditBookDialog({
  book,
  saving,
  error,
  onClose,
  onSave,
}: {
  book: BookSummary | null
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (input: { title: string; coverBlob: Blob | null | undefined }) => void
}) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [coverBlob, setCoverBlob] = useState<Blob | null | undefined>(undefined)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!book) return
    setTitle(book.title)
    setCoverBlob(undefined)
    setLocalError(null)
  }, [book])

  const previewCover = coverBlob === undefined ? book?.coverBlob : coverBlob

  return (
    <Dialog open={book !== null} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar livro</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <Box sx={{ width: 132, mx: 'auto' }}>
          {book && (
            <BookCover title={title || book.title} format={book.format} coverBlob={previewCover} />
          )}
        </Box>
        <TextField
          label="Nome"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          fullWidth
          autoFocus
          disabled={saving}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" disabled={saving} onClick={() => coverInputRef.current?.click()}>
            Trocar capa
          </Button>
          <Button
            variant="text"
            disabled={saving || !previewCover}
            onClick={() => {
              setCoverBlob(null)
              setLocalError(null)
            }}
          >
            Remover capa
          </Button>
        </Box>
        <input
          ref={coverInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            void prepareCoverImage(file)
              .then((blob) => {
                setCoverBlob(blob)
                setLocalError(null)
              })
              .catch((caught: unknown) => {
                setLocalError(caught instanceof Error ? caught.message : 'Não foi possível usar esta imagem.')
              })
          }}
        />
        {(localError || error) && (
          <Typography color="error" variant="body2">
            {localError || error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={saving || !title.trim()}
          onClick={() => onSave({ title: title.trim(), coverBlob })}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
