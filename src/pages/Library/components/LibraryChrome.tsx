import AddIcon from '@mui/icons-material/Add'
import ContrastIcon from '@mui/icons-material/Contrast'
import FilterListIcon from '@mui/icons-material/FilterList'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { ReaderTheme } from '../../../theme/readerThemes.ts'
import type { LibraryFormatFilter, LibrarySort } from '../hooks/useLibraryFilters.ts'

const formatOptions: { value: LibraryFormatFilter; label: string }[] = [
  { value: 'all', label: 'Todos os formatos' },
  { value: 'epub', label: 'EPUB' },
  { value: 'pdf', label: 'PDF' },
  { value: 'txt', label: 'TXT' },
]

const sortOptions: { value: LibrarySort; label: string }[] = [
  { value: 'recent', label: 'Recentes' },
  { value: 'title', label: 'Título A–Z' },
  { value: 'progress', label: 'Progresso' },
]

export function LibraryChrome({
  theme,
  query,
  format,
  sort,
  canAdd,
  importing,
  onQuery,
  onFormat,
  onSort,
  onTheme,
  onAdd,
}: {
  theme: ReaderTheme
  query: string
  format: LibraryFormatFilter
  sort: LibrarySort
  canAdd: boolean
  importing: boolean
  onQuery: (value: string) => void
  onFormat: (value: LibraryFormatFilter) => void
  onSort: (value: LibrarySort) => void
  onTheme: () => void
  onAdd: () => void
}) {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null)

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <TextField
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Pesquisar no Readly"
          fullWidth
          size="small"
          slotProps={{
            htmlInput: { 'aria-label': 'Pesquisar livros' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              bgcolor: 'background.paper',
              minHeight: 46,
            },
          }}
        />
        <IconButton
          aria-label={`Tema ${theme.label}. Trocar tema.`}
          onClick={onTheme}
          sx={chromeIconSx}
        >
          <ContrastIcon />
        </IconButton>
        {canAdd && (
          <IconButton
            aria-label={importing ? 'Importando livros' : 'Adicionar livro'}
            onClick={onAdd}
            disabled={importing}
            sx={{
              ...chromeIconSx,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <AddIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Biblioteca
        </Typography>
        <IconButton
          aria-label="Filtros e ordenação"
          onClick={(event) => setFilterAnchor(event.currentTarget)}
          sx={chromeIconSx}
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: 12, fontWeight: 700, opacity: 0.65 }}>
          FORMATO
        </Typography>
        {formatOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={format === option.value}
            onClick={() => {
              onFormat(option.value)
              setFilterAnchor(null)
            }}
          >
            {option.label}
          </MenuItem>
        ))}
        <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: 12, fontWeight: 700, opacity: 0.65 }}>
          ORDENAR
        </Typography>
        {sortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={sort === option.value}
            onClick={() => {
              onSort(option.value)
              setFilterAnchor(null)
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

const chromeIconSx = {
  width: 44,
  height: 44,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
} as const
