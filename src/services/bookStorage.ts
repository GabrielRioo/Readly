import type { BookFormat, BookRecord, BookSummary, ReadingBookmark, ReadingLocation } from '../types/book.ts'
import { titleFromFileName } from '../utils/text.ts'
import { validateBookFile } from '../utils/fileValidation.ts'
import { db } from './db.ts'

const emptyLocation: ReadingLocation = { chapterIndex: 0, page: 1, scrollRatio: 0 }

export async function listBooks(): Promise<BookSummary[]> {
  const books = await db.books.orderBy('addedAt').reverse().toArray()
  return books.map(toSummary)
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  return db.books.get(id)
}

export async function addBook(file: File): Promise<BookSummary> {
  const format = await validateBookFile(file)
  const title = await readTitle(file, format)
  const record: BookRecord = {
    id: crypto.randomUUID(),
    title,
    format,
    fileName: file.name,
    size: file.size,
    addedAt: Date.now(),
    progress: 0,
    location: emptyLocation,
    blob: file,
  }
  await db.books.add(record)
  return toSummary(record)
}

export async function deleteBook(id: string): Promise<void> {
  await db.books.delete(id)
}

export async function saveReadingLocation(
  id: string,
  location: ReadingLocation,
  progress: number,
): Promise<void> {
  await db.books.update(id, { location, progress })
}

export async function saveReadingBookmark(
  id: string,
  bookmark: ReadingBookmark | null,
): Promise<void> {
  await db.books.update(id, { bookmark })
}

async function readTitle(file: File, format: BookFormat): Promise<string> {
  const fallback = titleFromFileName(file.name)
  if (format === 'txt') {
    const { readTxt } = await import('./txtService.ts')
    const text = await readTxt(file)
    if (!text.trim()) throw new Error('Esse TXT está vazio.')
    return fallback
  }

  const buffer = await file.arrayBuffer()
  if (format === 'pdf') {
    const { readPdfTitle } = await import('./pdfService.ts')
    return (await readPdfTitle(buffer)) || fallback
  }

  const { readEpubTitle } = await import('./epubService.ts')
  return (await readEpubTitle(buffer)) || fallback
}

function toSummary(book: BookRecord): BookSummary {
  return {
    id: book.id,
    title: book.title,
    format: book.format,
    fileName: book.fileName,
    size: book.size,
    addedAt: book.addedAt,
    progress: book.progress,
  }
}
