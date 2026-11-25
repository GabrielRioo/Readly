import { db } from './db.ts'

const MAX_CHARS = 500
const DEFAULT_ENDPOINT = 'https://api.mymemory.translated.net/get'
const MAX_MEANINGS = 5
const SINGLE_WORD = /^[A-Za-z\u00C0-\u024F]+(?:['’-][A-Za-z\u00C0-\u024F]+)*$/

export interface TranslationResult {
  translation: string
  meanings: string[]
}

export async function translateToPortuguese(source: string): Promise<TranslationResult> {
  const text = source.replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('Nada para traduzir.')
  if (text.length > MAX_CHARS) {
    throw new Error('Selecione um trecho de até 500 caracteres.')
  }

  const key = text.toLowerCase()
  const cached = await db.translations.get(key)
  if (cached) {
    return {
      translation: cached.translation,
      meanings: cached.meanings ?? [],
    }
  }

  const result = await requestTranslation(text)
  await db.translations.put({
    key,
    translation: result.translation,
    meanings: result.meanings,
    createdAt: Date.now(),
  })
  return result
}

export function isSingleWord(text: string): boolean {
  return SINGLE_WORD.test(text.trim())
}

async function requestTranslation(text: string): Promise<TranslationResult> {
  const configured = import.meta.env.VITE_TRANSLATION_API_URL?.trim()
  const endpoint = configured || DEFAULT_ENDPOINT
  const url = new URL(endpoint)
  url.searchParams.set('q', text)
  url.searchParams.set('langpair', 'en|pt-BR')

  let response: Response
  try {
    response = await fetch(url, {
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    throw new Error('Sem conexão para traduzir. O trecho fica salvo no livro mesmo assim.')
  }

  if (!response.ok) throw new Error('Não foi possível traduzir agora.')

  const payload = await response.json()
  const translation = readTranslation(payload)
  if (!translation || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translation)) {
    throw new Error('Limite diário de tradução atingido. Tente de novo mais tarde.')
  }

  const meanings = isSingleWord(text) ? readMeanings(payload, translation) : []
  return { translation, meanings }
}

function readTranslation(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const data = payload as { responseData?: { translatedText?: unknown } }
  const text = data.responseData?.translatedText
  return typeof text === 'string' ? text.trim() : null
}

function readMeanings(payload: unknown, primary: string): string[] {
  if (!payload || typeof payload !== 'object') return []
  const matches = (payload as { matches?: unknown }).matches
  if (!Array.isArray(matches)) return primary ? [primary] : []

  const ranked = matches
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as { translation?: unknown; quality?: unknown; match?: unknown; 'usage-count'?: unknown }
      if (typeof item.translation !== 'string') return null
      const translation = normalizeMeaning(item.translation)
      if (!translation) return null
      return {
        translation,
        quality: Number(item.quality) || 0,
        match: Number(item.match) || 0,
        usage: Number(item['usage-count']) || 0,
      }
    })
    .filter((entry): entry is { translation: string; quality: number; match: number; usage: number } => entry !== null)
    .sort((a, b) => b.match - a.match || b.quality - a.quality || b.usage - a.usage)

  const unique: string[] = []
  for (const entry of ranked) {
    if (unique.some((item) => item.toLowerCase() === entry.translation.toLowerCase())) continue
    unique.push(entry.translation)
    if (unique.length >= MAX_MEANINGS) break
  }

  const primaryNormalized = normalizeMeaning(primary)
  if (primaryNormalized && !unique.some((item) => item.toLowerCase() === primaryNormalized.toLowerCase())) {
    unique.unshift(primaryNormalized)
  }

  return unique.slice(0, MAX_MEANINGS)
}

function normalizeMeaning(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[.]+$/g, '').trim()
}
