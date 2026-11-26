import { useEffect, useState } from 'react'
import { translateToPortuguese } from '../../../services/translationService.ts'
import type { VocabularyRecord } from '../../../types/vocabulary.ts'
import { errorMessage } from '../../../utils/text.ts'

export interface LookupRequest {
  text: string
  origin: 'selection' | 'vocabulary'
  entryId?: string
}

export function useTextLookup() {
  const [request, setRequest] = useState<LookupRequest | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [meanings, setMeanings] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [entryId, setEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (!request) return
    if (request.origin === 'vocabulary') return

    let active = true
    translateToPortuguese(request.text)
      .then((value) => {
        if (!active) return
        setTranslation(value.translation)
        setMeanings(value.meanings)
        setStatus('ready')
      })
      .catch((caught: unknown) => {
        if (!active) return
        setError(errorMessage(caught, 'Não foi possível traduzir.'))
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [request])

  function lookup(text: string, options?: { saved?: boolean; entryId?: string | null }) {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    if (
      request?.text === normalized &&
      request.origin === 'selection' &&
      status !== 'error' &&
      Boolean(options?.saved) === saved &&
      (options?.entryId ?? null) === entryId
    ) {
      return
    }
    setRequest({ text: normalized, origin: 'selection', entryId: options?.entryId ?? undefined })
    setStatus('loading')
    setTranslation(null)
    setMeanings([])
    setError(null)
    setSaved(Boolean(options?.saved))
    setEntryId(options?.entryId ?? null)
  }

  function openSaved(entry: VocabularyRecord) {
    setRequest({ text: entry.source, origin: 'vocabulary', entryId: entry.id })
    setTranslation(entry.translation)
    setMeanings([])
    setStatus('ready')
    setError(null)
    setSaved(true)
    setEntryId(entry.id)
  }

  function clear() {
    setRequest(null)
    setTranslation(null)
    setMeanings([])
    setError(null)
    setStatus('idle')
    setSaved(false)
    setEntryId(null)
    window.getSelection()?.removeAllRanges()
  }

  return {
    request,
    translation,
    meanings,
    status,
    error,
    saved,
    entryId,
    markSaved: (id?: string) => {
      setSaved(true)
      if (id) setEntryId(id)
    },
    markUnsaved: () => {
      setSaved(false)
      setEntryId(null)
    },
    lookup,
    openSaved,
    clear,
  }
}
