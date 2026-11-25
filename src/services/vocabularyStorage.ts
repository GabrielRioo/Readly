import type { VocabularyRecord } from '../types/vocabulary.ts'
import { db } from './db.ts'

export async function listVocabulary(): Promise<VocabularyRecord[]> {
  return db.vocabulary.orderBy('createdAt').reverse().toArray()
}

export async function saveVocabularyEntry(input: {
  source: string
  translation: string
  bookId: string
  bookTitle: string
}): Promise<void> {
  const source = input.source.replace(/\s+/g, ' ').trim()
  const translation = input.translation.trim()
  if (!source || !translation) throw new Error('Nada para salvar.')

  const key = source.toLowerCase()
  const existing = await db.vocabulary.filter((entry) => entry.source.toLowerCase() === key).first()
  if (existing) {
    await db.vocabulary.update(existing.id, {
      translation,
      bookId: input.bookId,
      bookTitle: input.bookTitle,
    })
    return
  }

  await db.vocabulary.add({
    id: crypto.randomUUID(),
    source,
    translation,
    bookId: input.bookId,
    bookTitle: input.bookTitle,
    createdAt: Date.now(),
  })
}

export async function deleteVocabularyEntry(id: string): Promise<void> {
  await db.vocabulary.delete(id)
}
