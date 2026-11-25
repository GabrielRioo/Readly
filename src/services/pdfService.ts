import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ReaderSection } from '../types/book.ts'
import { plainTextToHtml } from '../utils/text.ts'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

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
    if (!text) {
      const message = 'Esta página não tem texto selecionável. Se o PDF for uma imagem escaneada, a leitura automática não funciona.'
      return { index, title, html: `<p>${message}</p>`, text: message }
    }

    return { index, title, html: plainTextToHtml(text), text }
  } catch {
    const message = 'Não foi possível ler o texto desta página.'
    return { index, title, html: `<p>${message}</p>`, text: message }
  }
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
