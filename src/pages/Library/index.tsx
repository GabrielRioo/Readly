import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.ts'
import { usePreferences } from '../../hooks/usePreferences.ts'
import { nextReaderTheme, readerThemes } from '../../theme/readerThemes.ts'
import type { BookSummary } from '../../types/book.ts'
import { errorMessage } from '../../utils/text.ts'
import { BookList } from './components/BookList.tsx'
import { EditBookDialog } from './components/EditBookDialog.tsx'
import { EmptyLibrary } from './components/EmptyLibrary.tsx'
import { LibraryChrome } from './components/LibraryChrome.tsx'
import { useLibrary } from './hooks/useLibrary.ts'
import { useLibraryFilters } from './hooks/useLibraryFilters.ts'

export function LibraryPage() {
  const library = useLibrary()
  const filters = useLibraryFilters(library.books)
  const { preferences, update } = usePreferences()
  const install = useInstallPrompt()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<BookSummary | null>(null)
  const [pendingEdit, setPendingEdit] = useState<BookSummary | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const theme = readerThemes[preferences.theme]

  function openPicker() {
    inputRef.current?.click()
  }

  return (
    <Box
      className="library-surface"
      sx={{
        px: { xs: 1.5, sm: 2.5 },
        pt: 'calc(18px + env(safe-area-inset-top))',
        pb: 4,
        minHeight: '100%',
      }}
    >
      <LibraryChrome
        theme={theme}
        query={filters.query}
        format={filters.format}
        sort={filters.sort}
        canAdd={library.status === 'ready'}
        importing={library.importing}
        onQuery={filters.setQuery}
        onFormat={filters.setFormat}
        onSort={filters.setSort}
        onTheme={() => update({ theme: nextReaderTheme(preferences.theme) })}
        onAdd={openPicker}
      />

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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {library.status === 'ready' && library.books.length === 0 && <EmptyLibrary onAdd={openPicker} />}

      {library.status === 'ready' && library.books.length > 0 && filters.visible.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          Nenhum livro com essa busca ou filtro.
        </Typography>
      )}

      {library.status === 'ready' && filters.visible.length > 0 && (
        <BookList books={filters.visible} onEdit={setPendingEdit} onDelete={setPendingDelete} />
      )}

      {install.canInstall && (
        <Button
          sx={{
            mt: 3,
            borderRadius: 999,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
          onClick={() => void install.install()}
        >
          Instalar neste aparelho
        </Button>
      )}

      <EditBookDialog
        book={pendingEdit}
        saving={editSaving}
        error={editError}
        onClose={() => {
          if (editSaving) return
          setPendingEdit(null)
          setEditError(null)
        }}
        onSave={(input) => {
          if (!pendingEdit) return
          setEditSaving(true)
          setEditError(null)
          void library
            .editBook(pendingEdit.id, input)
            .then(() => {
              setPendingEdit(null)
            })
            .catch((caught: unknown) => {
              setEditError(errorMessage(caught, 'Não foi possível salvar as alterações.'))
            })
            .finally(() => {
              setEditSaving(false)
            })
        }}
      />

      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Excluir livro?</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingDelete
              ? `“${pendingDelete.title}” sai deste aparelho. O vocabulário salvo permanece.`
              : ''}
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
