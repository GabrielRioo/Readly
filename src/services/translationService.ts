import { db } from './db.ts'

const MAX_CHARS = 500
const DEFAULT_ENDPOINT = 'https://api.mymemory.translated.net/get'

export async function translateToPortuguese(source: string): Promise<string> {
  const text = source.replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('Nada para traduzir.')
  if (text.length > MAX_CHARS) {
    throw new Error('Selecione um trecho de até 500 caracteres.')
  }

  const key = text.toLowerCase()
  const cached = await db.translations.get(key)
  if (cached) return cached.translation

  const translation = await requestTranslation(text)
  await db.translations.put({ key, translation, createdAt: Date.now() })
  return translation
}

async function requestTranslation(text: string): Promise<string> {
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

  const translation = readTranslation(await response.json())
  if (!translation || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translation)) {
    throw new Error('Limite diário de tradução atingido. Tente de novo mais tarde.')
  }

  return translation
}

function readTranslation(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const data = payload as { responseData?: { translatedText?: unknown } }
  const text = data.responseData?.translatedText
  return typeof text === 'string' ? text.trim() : null
}
