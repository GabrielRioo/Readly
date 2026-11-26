import { useEffect, useState } from 'react'
import { listBooks } from '../../../services/bookStorage.ts'
import { deleteVocabularyEntry, listVocabulary } from '../../../services/vocabularyStorage.ts'
import type { VocabularyRecord } from '../../../types/vocabulary.ts'

export function useVocabulary() {
  const [entries, setEntries] = useState<VocabularyRecord[]>([])
  const [bookIds, setBookIds] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listVocabulary(), listBooks()])
      .then(([rows, books]) => {
        if (!active) return
        setEntries(rows)
        setBookIds(new Set(books.map((book) => book.id)))
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  async function remove(id: string) {
    await deleteVocabularyEntry(id)
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const normalized = query.trim().toLowerCase()
  const visible = normalized
    ? entries.filter((entry) =>
        `${entry.source} ${entry.translation} ${entry.bookTitle}`.toLowerCase().includes(normalized),
      )
    : entries

  return {
    entries: visible,
    bookIds,
    status,
    query,
    setQuery,
    remove,
    isEmpty: entries.length === 0,
  }
}
