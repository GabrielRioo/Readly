import type { VocabularyLocation, VocabularyRecord } from '../types/vocabulary.ts'
import { db } from './db.ts'

export async function listVocabulary(): Promise<VocabularyRecord[]> {
  return db.vocabulary.orderBy('createdAt').reverse().toArray()
}

export async function getVocabularyEntry(id: string): Promise<VocabularyRecord | undefined> {
  return db.vocabulary.get(id)
}

export async function listVocabularyForBook(bookId: string): Promise<VocabularyRecord[]> {
  return db.vocabulary.where('bookId').equals(bookId).toArray()
}

export async function listVocabularyForSection(
  bookId: string,
  sectionIndex: number,
): Promise<VocabularyRecord[]> {
  const rows = await listVocabularyForBook(bookId)
  return rows.filter(
    (entry) =>
      entry.sectionIndex === sectionIndex &&
      typeof entry.startOffset === 'number' &&
      typeof entry.length === 'number' &&
      entry.length > 0,
  )
}

export async function findVocabularyEntry(
  bookId: string,
  source: string,
): Promise<VocabularyRecord | undefined> {
  const key = source.replace(/\s+/g, ' ').trim().toLowerCase()
  if (!key) return undefined
  const rows = await listVocabularyForBook(bookId)
  return rows.find((entry) => entry.source.toLowerCase() === key)
}

export async function saveVocabularyEntry(input: {
  source: string
  translation: string
  bookId: string
  bookTitle: string
  location?: VocabularyLocation
}): Promise<VocabularyRecord> {
  const source = input.source.replace(/\s+/g, ' ').trim()
  const translation = input.translation.trim()
  if (!source || !translation) throw new Error('Nada para salvar.')

  const existing = await findVocabularyEntry(input.bookId, source)
  const location = input.location

  if (existing) {
    const next: VocabularyRecord = {
      ...existing,
      source,
      translation,
      bookId: input.bookId,
      bookTitle: input.bookTitle,
      sectionIndex: location?.sectionIndex ?? existing.sectionIndex,
      startOffset: location?.startOffset ?? existing.startOffset,
      length: location?.length ?? existing.length,
    }
    await db.vocabulary.put(next)
    return next
  }

  const created: VocabularyRecord = {
    id: crypto.randomUUID(),
    source,
    translation,
    bookId: input.bookId,
    bookTitle: input.bookTitle,
    createdAt: Date.now(),
    sectionIndex: location?.sectionIndex,
    startOffset: location?.startOffset,
    length: location?.length,
  }
  await db.vocabulary.add(created)
  return created
}

export async function deleteVocabularyEntry(id: string): Promise<void> {
  await db.vocabulary.delete(id)
}
