import { useCallback, useEffect, useState } from 'react'
import { listVocabularyForSection } from '../../../services/vocabularyStorage.ts'
import type { VocabularyRecord } from '../../../types/vocabulary.ts'

export function useSectionVocabulary(bookId: string | undefined, sectionIndex: number | undefined) {
  const [entries, setEntries] = useState<VocabularyRecord[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!bookId || sectionIndex === undefined) {
      setEntries([])
      setStatus('idle')
      return
    }
    let active = true
    setStatus('loading')
    listVocabularyForSection(bookId, sectionIndex)
      .then((rows) => {
        if (!active) return
        setEntries(rows)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setEntries([])
        setStatus('ready')
      })
    return () => {
      active = false
    }
  }, [bookId, sectionIndex, revision])

  const refresh = useCallback(() => {
    setRevision((value) => value + 1)
  }, [])

  const upsertLocal = useCallback(
    (entry: VocabularyRecord) => {
      setEntries((current) => {
        const without = current.filter((item) => item.id !== entry.id)
        if (
          entry.sectionIndex === sectionIndex &&
          typeof entry.startOffset === 'number' &&
          typeof entry.length === 'number' &&
          entry.length > 0
        ) {
          return [...without, entry]
        }
        return without
      })
    },
    [sectionIndex],
  )

  const removeLocal = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }, [])

  return { entries, status, refresh, upsertLocal, removeLocal }
}
