import AddIcon from '@mui/icons-material/Add'
import ContrastIcon from '@mui/icons-material/Contrast'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { useLibrary } from './hooks/useLibrary.ts'

export function LibraryPage() {
  const library = useLibrary()
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
        px: { xs: 2, sm: 3 },
        pt: 'calc(28px + env(safe-area-inset-top))',
        pb: 4,
        minHeight: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1,
        }}
      >
        <Typography
          component="h1"
          sx={{
            m: 0,
            fontFamily: '"Literata Variable", Palatino, serif',
            fontWeight: 650,
            fontSize: { xs: '2.35rem', sm: '2.75rem' },
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            color: 'primary.main',
          }}
        >
          Readly
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          <IconButton
            aria-label={`Tema ${theme.label}. Trocar tema de cor.`}
            onClick={() => update({ theme: nextReaderTheme(preferences.theme) })}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <ContrastIcon />
          </IconButton>
          {library.status === 'ready' && library.books.length > 0 && (
            <Button
              variant="contained"
              onClick={openPicker}
              disabled={library.importing}
              startIcon={<AddIcon />}
              sx={{ borderRadius: 999, px: 2 }}
            >
              {library.importing ? 'Importando…' : 'Adicionar'}
            </Button>
          )}
        </Box>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 420, lineHeight: 1.55 }}>
        Leitura e escuta em inglês, com tradução no toque — tudo neste aparelho.
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {library.status === 'ready' && library.books.length === 0 && <EmptyLibrary onAdd={openPicker} />}

      {library.status === 'ready' && library.books.length > 0 && (
        <BookList books={library.books} onEdit={setPendingEdit} onDelete={setPendingDelete} />
      )}

      {install.canInstall && (
        <Button
          sx={{
            mt: 3,
            borderRadius: 999,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(255,255,255,0.45)',
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
