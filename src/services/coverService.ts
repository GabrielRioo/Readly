import type { BookFormat } from '../types/book.ts'

const MAX_COVER_EDGE = 512

export async function extractBookCover(data: ArrayBuffer, format: BookFormat): Promise<Blob | null> {
  if (format === 'txt') return null
  try {
    if (format === 'pdf') return await extractPdfCover(data)
    return await extractEpubCover(data)
  } catch {
    return null
  }
}

async function extractEpubCover(data: ArrayBuffer): Promise<Blob | null> {
  const { default: ePub } = await import('epubjs')
  const book = ePub({} as unknown as string)
  try {
    await book.open(data as unknown as string)
    await book.ready
    const coverUrl = await book.coverUrl()
    if (!coverUrl) return null
    const response = await fetch(coverUrl)
    if (!response.ok) return null
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) return null
    return await shrinkImageBlob(blob)
  } finally {
    try {
      book.destroy()
    } catch {
      // ignore cleanup failures
    }
  }
}

async function extractPdfCover(data: ArrayBuffer): Promise<Blob | null> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  const pdfWorkerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const pdf = await getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise
  try {
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const scale = Math.min(2.2, MAX_COVER_EDGE / Math.max(base.width, base.height))
    const viewport = page.getViewport({ scale: Math.max(scale, 0.8) })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) return null
    await page.render({ canvas, canvasContext: context, viewport }).promise
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.82)
    return blob
  } finally {
    await pdf.loadingTask.destroy()
  }
}

export async function prepareCoverImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('A imagem da capa deve ter no máximo 8 MB.')
  }
  return shrinkImageBlob(file)
}

async function shrinkImageBlob(blob: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return blob
  const bitmap = await createImageBitmap(blob)
  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    if (longest <= MAX_COVER_EDGE) return blob
    const scale = MAX_COVER_EDGE / longest
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return blob
    context.drawImage(bitmap, 0, 0, width, height)
    return (await canvasToBlob(canvas, 'image/jpeg', 0.82)) ?? blob
  } finally {
    bitmap.close()
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}
