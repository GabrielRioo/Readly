import { useMemo, useState } from 'react'
import type { BookFormat, BookSummary } from '../../../types/book.ts'

export type LibrarySort = 'recent' | 'title' | 'progress'
export type LibraryFormatFilter = 'all' | BookFormat

export function useLibraryFilters(books: BookSummary[]) {
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<LibraryFormatFilter>('all')
  const [sort, setSort] = useState<LibrarySort>('recent')

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const filtered = books.filter((book) => {
      if (format !== 'all' && book.format !== format) return false
      if (!normalized) return true
      return `${book.title} ${book.fileName}`.toLowerCase().includes(normalized)
    })

    const ordered = [...filtered]
    if (sort === 'title') {
      ordered.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }))
    } else if (sort === 'progress') {
      ordered.sort((a, b) => b.progress - a.progress)
    } else {
      ordered.sort((a, b) => b.addedAt - a.addedAt)
    }
    return ordered
  }, [books, format, query, sort])

  return {
    query,
    setQuery,
    format,
    setFormat,
    sort,
    setSort,
    visible,
    isFiltering: Boolean(query.trim()) || format !== 'all' || sort !== 'recent',
  }
}
