import { useEffect, useState } from 'react'
import { translateToPortuguese } from '../../../services/translationService.ts'
import { errorMessage } from '../../../utils/text.ts'

export interface LookupRequest {
  text: string
  origin: 'selection' | 'hover'
}

export function useTextLookup() {
  const [request, setRequest] = useState<LookupRequest | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!request) return
    let active = true
    translateToPortuguese(request.text)
      .then((value) => {
        if (!active) return
        setTranslation(value)
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

  function lookup(text: string, origin: LookupRequest['origin']) {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    if (request?.text === normalized && request.origin === origin && status !== 'error') return
    setRequest({ text: normalized, origin })
    setStatus('loading')
    setTranslation(null)
    setError(null)
    setSaved(false)
  }

  function clear() {
    setRequest(null)
    setTranslation(null)
    setError(null)
    setStatus('idle')
    setSaved(false)
    window.getSelection()?.removeAllRanges()
  }

  return { request, translation, status, error, saved, markSaved: () => setSaved(true), lookup, clear }
}
