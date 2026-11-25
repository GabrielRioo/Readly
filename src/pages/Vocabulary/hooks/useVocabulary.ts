import { useEffect, useState } from 'react'
import { deleteVocabularyEntry, listVocabulary } from '../../../services/vocabularyStorage.ts'
import type { VocabularyRecord } from '../../../types/vocabulary.ts'

export function useVocabulary() {
  const [entries, setEntries] = useState<VocabularyRecord[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    listVocabulary()
      .then((rows) => {
        if (!active) return
        setEntries(rows)
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
        `${entry.source} ${entry.translation}`.toLowerCase().includes(normalized),
      )
    : entries

  return { entries: visible, status, query, setQuery, remove, isEmpty: entries.length === 0 }
}
