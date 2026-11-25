import type { Book } from 'epubjs'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { OpenedReader, ReaderSection } from '../types/book.ts'
import { readingProgress } from '../utils/text.ts'
import { getBook } from './bookStorage.ts'
import { loadEpubSection, parseEpub, type ParsedEpub } from './epubService.ts'
import { loadPdfSection, openPdf } from './pdfService.ts'
import { readTxt, textToParagraphs } from './txtService.ts'
import { plainTextToHtml } from '../utils/text.ts'

type Session =
  | { format: 'txt'; text: string }
  | { format: 'epub'; parsed: ParsedEpub }
  | { format: 'pdf'; pdf: PDFDocumentProxy }

const sessions = new Map<string, Session>()
const generations = new Map<string, number>()

export class ReaderCancelledError extends Error {
  constructor() {
    super('Leitura cancelada.')
    this.name = 'ReaderCancelledError'
  }
}

export function isReaderCancelled(error: unknown): boolean {
  return error instanceof ReaderCancelledError
}

export async function openReaderBook(bookId: string): Promise<OpenedReader> {
  const token = (generations.get(bookId) ?? 0) + 1
  generations.set(bookId, token)
  releaseSession(bookId)

  const record = await getBook(bookId)
  if (!record) throw new Error('Livro não encontrado neste dispositivo.')

  const ensureCurrent = () => {
    if (generations.get(bookId) !== token) throw new ReaderCancelledError()
  }

  if (record.format === 'txt') {
    const text = textToParagraphs(await readTxt(record.blob))
    ensureCurrent()
    sessions.set(bookId, { format: 'txt', text })
    const section = sectionFromText(0, record.title || 'Texto', text)
    return openedFrom(record, 1, [section.title], section)
  }

  if (record.format === 'pdf') {
    const pdf = await openPdf(await record.blob.arrayBuffer())
    try {
      ensureCurrent()
    } catch (error) {
      await pdf.loadingTask.destroy()
      throw error
    }
    sessions.set(bookId, { format: 'pdf', pdf })
    const index = clampIndex(record.location.chapterIndex, pdf.numPages)
    const section = await loadPdfSection(pdf, index)
    ensureCurrent()
    const titles = pdf.numPages <= 80
      ? Array.from({ length: pdf.numPages }, (_, page) => `Página ${page + 1}`)
      : []
    return openedFrom(record, pdf.numPages, titles, section)
  }

  const parsed = await parseEpub(await record.blob.arrayBuffer())
  try {
    ensureCurrent()
  } catch (error) {
    parsed.book.destroy()
    throw error
  }
  sessions.set(bookId, { format: 'epub', parsed })
  const index = clampIndex(record.location.chapterIndex, parsed.sections.length)
  const section = await loadEpubSection(parsed, index)
  ensureCurrent()
  return openedFrom(record, parsed.sections.length, parsed.titles, section)
}

export async function loadReaderSection(bookId: string, index: number): Promise<ReaderSection> {
  const session = sessions.get(bookId)
  if (!session) throw new Error('Abra o livro de novo.')

  if (session.format === 'txt') {
    return sectionFromText(0, 'Texto', session.text)
  }
  if (session.format === 'pdf') {
    return loadPdfSection(session.pdf, clampIndex(index, session.pdf.numPages))
  }
  return loadEpubSection(session.parsed, clampIndex(index, session.parsed.sections.length))
}

export function closeReaderBook(bookId: string): void {
  generations.set(bookId, (generations.get(bookId) ?? 0) + 1)
  releaseSession(bookId)
}

function releaseSession(bookId: string): void {
  const session = sessions.get(bookId)
  if (!session) return
  if (session.format === 'epub') destroyEpub(session.parsed.book)
  if (session.format === 'pdf') void session.pdf.loadingTask.destroy()
  sessions.delete(bookId)
}

function destroyEpub(book: Book): void {
  book.destroy()
}

function openedFrom(
  record: { id: string; title: string; format: OpenedReader['format']; location: OpenedReader['location']; progress: number },
  sectionCount: number,
  sectionTitles: string[],
  section: ReaderSection,
): OpenedReader {
  const count = Math.max(sectionCount, 1)
  return {
    id: record.id,
    title: record.title,
    format: record.format,
    sectionCount: count,
    sectionTitles,
    location: {
      ...record.location,
      chapterIndex: section.index,
      page: section.index + 1,
    },
    progress: record.progress || readingProgress(count, section.index, record.location.scrollRatio),
    section,
  }
}

function sectionFromText(index: number, title: string, text: string): ReaderSection {
  const trimmed = text.trim()
  if (!trimmed) {
    const message = 'Este trecho não tem texto selecionável.'
    return { index, title, html: `<p>${message}</p>`, text: message }
  }
  return { index, title, html: plainTextToHtml(trimmed), text: trimmed }
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(Math.max(index, 0), count - 1)
}
