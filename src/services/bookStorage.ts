import type { BookFormat, BookRecord, BookSummary, ReadingBookmark, ReadingLocation } from '../types/book.ts'
import { titleFromFileName } from '../utils/text.ts'
import { validateBookFile } from '../utils/fileValidation.ts'
import { extractBookCover, refineCoverBlob } from './coverService.ts'
import { db } from './db.ts'

const COVER_TRIM_FLAG = 'readly-cover-trim-v1'

const emptyLocation: ReadingLocation = { chapterIndex: 0, page: 1, scrollRatio: 0 }

export async function listBooks(): Promise<BookSummary[]> {
  const books = await db.books.orderBy('addedAt').reverse().toArray()
  return books.map(toSummary)
}

export async function backfillMissingCovers(
  onCover: (book: BookSummary) => void,
): Promise<void> {
  const books = await db.books.toArray()
  const shouldTrimStored = !localStorage.getItem(COVER_TRIM_FLAG)

  for (const book of books) {
    if (book.format === 'txt') continue

    if (!book.coverBlob) {
      const updated = await ensureCover(book)
      if (updated.coverBlob) onCover(toSummary(updated))
      continue
    }

    if (!shouldTrimStored) continue

    try {
      const coverBlob = await refineCoverBlob(book.coverBlob)
      await db.books.update(book.id, { coverBlob })
      onCover(toSummary({ ...book, coverBlob }))
    } catch {
      // keep previous cover if trim fails
    }
  }

  if (shouldTrimStored) localStorage.setItem(COVER_TRIM_FLAG, '1')
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  return db.books.get(id)
}

export async function addBook(file: File): Promise<BookSummary> {
  const format = await validateBookFile(file)
  const buffer = await file.arrayBuffer()
  const title = await readTitle(buffer.slice(0), file.name, format)
  const coverBlob = await extractBookCover(buffer.slice(0), format)
  const record: BookRecord = {
    id: crypto.randomUUID(),
    title,
    format,
    fileName: file.name,
    size: file.size,
    addedAt: Date.now(),
    progress: 0,
    location: emptyLocation,
    coverBlob,
    blob: new Blob([buffer], { type: file.type || guessMime(format) }),
  }
  await db.books.add(record)
  return toSummary(record)
}

export async function deleteBook(id: string): Promise<void> {
  await db.books.delete(id)
}

export async function updateBookDetails(
  id: string,
  patch: { title?: string; coverBlob?: Blob | null },
): Promise<BookSummary> {
  const book = await db.books.get(id)
  if (!book) throw new Error('Livro não encontrado neste aparelho.')

  const next: Partial<BookRecord> = {}
  if (typeof patch.title === 'string') {
    const title = patch.title.replace(/\s+/g, ' ').trim()
    if (!title) throw new Error('Digite um nome para o livro.')
    next.title = title
  }
  if (patch.coverBlob !== undefined) {
    next.coverBlob = patch.coverBlob
  }

  if (Object.keys(next).length === 0) return toSummary(book)
  await db.books.update(id, next)
  return toSummary({ ...book, ...next })
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

async function ensureCover(book: BookRecord): Promise<BookRecord> {
  if (book.coverBlob || book.format === 'txt') return book
  try {
    const coverBlob = await extractBookCover(await book.blob.arrayBuffer(), book.format)
    if (!coverBlob) return book
    await db.books.update(book.id, { coverBlob })
    return { ...book, coverBlob }
  } catch {
    return book
  }
}

async function readTitle(buffer: ArrayBuffer, fileName: string, format: BookFormat): Promise<string> {
  const fallback = titleFromFileName(fileName)
  if (format === 'txt') {
    const { readTxt } = await import('./txtService.ts')
    const text = await readTxt(new Blob([buffer]))
    if (!text.trim()) throw new Error('Esse TXT está vazio.')
    return fallback
  }

  if (format === 'pdf') {
    const { readPdfTitle } = await import('./pdfService.ts')
    return (await readPdfTitle(buffer.slice(0))) || fallback
  }

  const { readEpubTitle } = await import('./epubService.ts')
  return (await readEpubTitle(buffer.slice(0))) || fallback
}

function guessMime(format: BookFormat): string {
  if (format === 'pdf') return 'application/pdf'
  if (format === 'epub') return 'application/epub+zip'
  return 'text/plain'
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
    coverBlob: book.coverBlob ?? null,
  }
}
