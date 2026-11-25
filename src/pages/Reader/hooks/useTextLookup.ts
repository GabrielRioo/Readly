import { useEffect, useState } from 'react'
import { translateToPortuguese } from '../../../services/translationService.ts'
import { errorMessage } from '../../../utils/text.ts'

export interface LookupRequest {
  text: string
  origin: 'selection'
}

export function useTextLookup() {
  const [request, setRequest] = useState<LookupRequest | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [meanings, setMeanings] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!request) return
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

  function lookup(text: string) {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    if (request?.text === normalized && status !== 'error') return
    setRequest({ text: normalized, origin: 'selection' })
    setStatus('loading')
    setTranslation(null)
    setMeanings([])
    setError(null)
    setSaved(false)
  }

  function clear() {
    setRequest(null)
    setTranslation(null)
    setMeanings([])
    setError(null)
    setStatus('idle')
    setSaved(false)
    window.getSelection()?.removeAllRanges()
  }

  return {
    request,
    translation,
    meanings,
    status,
    error,
    saved,
    markSaved: () => setSaved(true),
    lookup,
    clear,
  }
}
