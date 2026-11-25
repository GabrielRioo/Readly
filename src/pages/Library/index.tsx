import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.ts'
import { BookList } from './components/BookList.tsx'
import { EmptyLibrary } from './components/EmptyLibrary.tsx'
import { useLibrary } from './hooks/useLibrary.ts'
import type { BookSummary } from '../../types/book.ts'

export function LibraryPage() {
  const library = useLibrary()
  const install = useInstallPrompt()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<BookSummary | null>(null)

  function openPicker() {
    inputRef.current?.click()
  }

  return (
    <Box sx={{ px: 2, pt: 'calc(20px + env(safe-area-inset-top))', pb: 3 }}>
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Leitor
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        Livros em inglês, com tradução e áudio, neste aparelho.
      </Typography>

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept=".epub,.pdf,.txt,application/epub+zip,application/pdf,text/plain"
        onChange={(event) => {
          const files = event.target.files
          if (files && files.length > 0) void library.importFiles(files)
          event.target.value = ''
        }}
      />

      {library.notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={library.dismissNotice}>
          {library.notice}
        </Alert>
      )}
      {library.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {library.error}
        </Alert>
      )}

      {library.status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {library.status === 'ready' && library.books.length === 0 && <EmptyLibrary onAdd={openPicker} />}

      {library.status === 'ready' && library.books.length > 0 && (
        <>
          <Button variant="contained" onClick={openPicker} disabled={library.importing} sx={{ mb: 2 }}>
            {library.importing ? 'Importando…' : 'Adicionar livro'}
          </Button>
          <BookList books={library.books} onDelete={setPendingDelete} />
        </>
      )}

      {install.canInstall && (
        <Button sx={{ mt: 2 }} onClick={() => void install.install()}>
          Instalar neste aparelho
        </Button>
      )}

      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Excluir livro?</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingDelete ? `“${pendingDelete.title}” sai deste aparelho. O vocabulário salvo permanece.` : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancelar</Button>
          <Button
            color="error"
            onClick={() => {
              if (!pendingDelete) return
              void library.removeBook(pendingDelete.id)
              setPendingDelete(null)
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
