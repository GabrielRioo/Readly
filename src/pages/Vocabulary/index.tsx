import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined'
import { Alert, Box, CircularProgress, IconButton, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../../hooks/usePreferences.ts'
import { useSpeech } from '../../hooks/useSpeech.ts'
import type { ReaderNavigationState } from '../../types/readerNavigation.ts'
import { useVocabulary } from './hooks/useVocabulary.ts'

export function VocabularyPage() {
  const vocabulary = useVocabulary()
  const { preferences } = usePreferences()
  const speech = useSpeech(preferences.speechRate, preferences.voiceURI)
  const navigate = useNavigate()

  return (
    <Box sx={{ px: 2, pt: 'calc(20px + env(safe-area-inset-top))', pb: 3 }}>
      <Typography
        component="h1"
        sx={{
          mb: 0.5,
          fontFamily: '"Literata Variable", Palatino, serif',
          fontWeight: 650,
          fontSize: '2rem',
          letterSpacing: '-0.03em',
        }}
      >
        Vocabulário
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
        Palavras e frases que você salvou enquanto lia. Toque para abrir o trecho no livro.
      </Typography>

      {vocabulary.status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {vocabulary.status === 'error' && <Alert severity="error">Não foi possível abrir o vocabulário.</Alert>}
      {speech.error && (
        <Alert severity="warning" onClose={speech.clearError} sx={{ mb: 2 }}>
          {speech.error}
        </Alert>
      )}

      {vocabulary.status === 'ready' && vocabulary.isEmpty && (
        <Typography className="fade-up">
          Nada salvo ainda. No livro, selecione um trecho e toque em Salvar.
        </Typography>
      )}

      {vocabulary.status === 'ready' && !vocabulary.isEmpty && (
        <>
          <TextField
            fullWidth
            label="Buscar"
            value={vocabulary.query}
            onChange={(event) => vocabulary.setQuery(event.target.value)}
            sx={{ mb: 2 }}
          />
          {vocabulary.entries.length === 0 && <Typography>Nenhum termo com essa busca.</Typography>}
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
            {vocabulary.entries.map((entry) => {
              const bookAvailable = vocabulary.bookIds.has(entry.bookId)
              const canOpen =
                bookAvailable &&
                typeof entry.sectionIndex === 'number' &&
                typeof entry.startOffset === 'number' &&
                typeof entry.length === 'number' &&
                entry.length > 0

              return (
                <Box
                  component="li"
                  key={entry.id}
                  className="fade-up"
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    borderRadius: 2,
                    px: 1,
                    py: 0.75,
                    mx: -1,
                    cursor: canOpen ? 'pointer' : 'default',
                    '&:active': canOpen ? { backgroundColor: 'action.selected' } : undefined,
                  }}
                  onClick={() => {
                    if (!canOpen) return
                    const state: ReaderNavigationState = {
                      focusVocabulary: {
                        entryId: entry.id,
                        sectionIndex: entry.sectionIndex!,
                      },
                    }
                    navigate(`/read/${entry.bookId}`, { state })
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography lang="en" sx={{ fontFamily: '"Literata Variable", Palatino, serif', fontSize: 18 }}>
                      {entry.source}
                    </Typography>
                    <Typography>{entry.translation}</Typography>
                    {entry.bookTitle && (
                      <Typography variant="body2" color="text.secondary">
                        {bookAvailable ? entry.bookTitle : `${entry.bookTitle} · livro removido`}
                      </Typography>
                    )}
                    {bookAvailable && !canOpen && (
                      <Typography variant="body2" color="text.secondary">
                        Sem trecho salvo — abra o livro pela biblioteca.
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    aria-label={`Ouvir ${entry.source}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      void speech.speak(entry.source)
                    }}
                  >
                    <VolumeUpOutlinedIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Excluir ${entry.source}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      void vocabulary.remove(entry.id)
                    }}
                  >
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Box>
              )
            })}
          </Box>
        </>
      )}
    </Box>
  )
}
