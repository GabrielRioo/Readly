import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ReaderSection } from '../types/book.ts'
import { plainTextToHtml } from '../utils/text.ts'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const paragraphCache = new WeakMap<PDFDocumentProxy, Map<number, string[]>>()

export async function readPdfTitle(data: ArrayBuffer): Promise<string> {
  const pdf = await openPdf(data)
  try {
    const metadata = await pdf.getMetadata()
    const info = metadata.info
    if (info && typeof info === 'object' && 'Title' in info && typeof info.Title === 'string') {
      return info.Title.trim()
    }
    return ''
  } finally {
    await pdf.loadingTask.destroy()
  }
}

export async function openPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  try {
    return await getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise
  } catch {
    throw new Error('Não foi possível ler este PDF. PDFs escaneados, sem texto, não funcionam nesta versão.')
  }
}

export async function loadPdfSection(pdf: PDFDocumentProxy, index: number): Promise<ReaderSection> {
  const pageNumber = index + 1
  const title = `Página ${pageNumber}`
  try {
    const current = await getPageParagraphs(pdf, pageNumber)
    if (current.length === 0) {
      const message =
        'Esta página não tem texto selecionável. Se o PDF for uma imagem escaneada, a leitura automática não funciona.'
      return { index, title, html: `<p>${message}</p>`, text: message }
    }

    const previous = pageNumber > 1 ? await getPageParagraphs(pdf, pageNumber - 1) : []
    const display = await stitchPageParagraphs(pdf, pageNumber, previous, current)

    if (display.length === 0) {
      const message = 'O parágrafo desta página foi unido à página anterior para não cortar o texto.'
      return { index, title, html: `<p>${message}</p>`, text: message }
    }

    const text = display.join('\n\n')
    return { index, title, html: plainTextToHtml(text), text }
  } catch {
    const message = 'Não foi possível ler o texto desta página.'
    return { index, title, html: `<p>${message}</p>`, text: message }
  }
}

async function stitchPageParagraphs(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  previous: string[],
  current: string[],
): Promise<string[]> {
  const display = stripCarryIn(previous, current)
  if (display.length === 0) return display

  let lookAhead = pageNumber + 1
  while (!isCompleteParagraph(display[display.length - 1]!) && lookAhead <= pdf.numPages) {
    const nextParas = await getPageParagraphs(pdf, lookAhead)
    if (nextParas.length === 0) {
      lookAhead += 1
      continue
    }
    const before = display[display.length - 1]!
    const { completed, consumed } = consumeToComplete(before, nextParas)
    display[display.length - 1] = completed
    if (consumed === 0 || completed === before) break
    lookAhead += 1
  }

  return display
}

function stripCarryIn(previous: string[], current: string[]): string[] {
  if (previous.length === 0 || current.length === 0) return [...current]

  const result = [...current]
  let carried = previous[previous.length - 1]!
  let consumed = 0

  while (consumed < result.length) {
    const nextPiece = result[consumed]!
    const mustJoin = !isCompleteParagraph(carried) || (consumed === 0 && isContinuationParagraph(nextPiece))
    if (!mustJoin) break
    carried = joinParagraphs(carried, nextPiece)
    consumed += 1
    if (isCompleteParagraph(carried)) break
  }

  if (consumed > 0) result.splice(0, consumed)
  return result
}

function consumeToComplete(start: string, nextParas: string[]): { completed: string; consumed: number } {
  let carried = start
  let consumed = 0
  while (consumed < nextParas.length && !isCompleteParagraph(carried)) {
    carried = joinParagraphs(carried, nextParas[consumed]!)
    consumed += 1
  }
  return { completed: carried, consumed }
}

function joinParagraphs(left: string, right: string): string {
  if (left.endsWith('-') && /^[a-zà-öø-ÿ]/i.test(right)) {
    return `${left.slice(0, -1)}${right}`
  }
  return `${left} ${right}`
}

function isCompleteParagraph(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  return /[.!?…]["’”')\]]*$/u.test(trimmed)
}

function isContinuationParagraph(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return /^[a-zà-öø-ÿ]/.test(trimmed)
}

async function getPageParagraphs(pdf: PDFDocumentProxy, pageNumber: number): Promise<string[]> {
  let cache = paragraphCache.get(pdf)
  if (!cache) {
    cache = new Map()
    paragraphCache.set(pdf, cache)
  }

  const cached = cache.get(pageNumber)
  if (cached) return cached

  const page = await pdf.getPage(pageNumber)
  const content = await page.getTextContent()
  const lines: string[] = []
  let line = ''

  for (const item of content.items) {
    if (!('str' in item)) continue
    line += item.str
    if (item.hasEOL) {
      lines.push(line.trim())
      line = ''
    } else if (item.str && !item.str.endsWith(' ')) {
      line += ' '
    }
  }
  if (line.trim()) lines.push(line.trim())

  const text = stripPrintedPageNumber(linesToParagraphs(lines), pageNumber)
  const paragraphs = text
    ? text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : []

  cache.set(pageNumber, paragraphs)
  return paragraphs
}

function linesToParagraphs(lines: string[]): string {
  const paragraphs: string[] = []
  let current = ''

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      if (current) paragraphs.push(current)
      current = ''
      continue
    }

    if (!current) {
      current = line
      continue
    }

    if (current.endsWith('-') && /^[a-z]/.test(line)) {
      current = `${current.slice(0, -1)}${line}`
      continue
    }

    if (/[.!?]"?$/.test(current) && /^["“]?[A-Z]/.test(line)) {
      paragraphs.push(current)
      current = line
      continue
    }

    current = `${current} ${line}`
  }

  if (current) paragraphs.push(current)
  return paragraphs.join('\n\n').trim()
}

function stripPrintedPageNumber(text: string, pageNumber: number): string {
  if (!text) return text
  const page = String(pageNumber)
  const lonePage = new RegExp(
    `^(?:[-–—•·.\\s]*)(${escapeRegExp(page)})(?:[-–—•·.\\s]*)$`,
  )
  const leadingPage = new RegExp(`^${escapeRegExp(page)}(?=\\s+[A-Za-z“"'(])`)
  const trailingPage = new RegExp(`(?<=[A-Za-z.,;:!?”"')])\\s+${escapeRegExp(page)}$`)

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !lonePage.test(paragraph))
    .map((paragraph, index, all) => {
      let next = paragraph
      if (index === 0) next = next.replace(leadingPage, '').trim()
      if (index === all.length - 1) next = next.replace(trailingPage, '').trim()
      return next
    })
    .filter(Boolean)

  return paragraphs.join('\n\n').trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
