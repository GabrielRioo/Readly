import type { BookFormat } from '../types/book.ts'

const MAX_COVER_EDGE = 512
const WHITE_THRESHOLD = 242
const BLANK_ROW_RATIO = 0.992

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
    return await shrinkImageBlob(blob, true)
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
    const scale = Math.min(2.6, (MAX_COVER_EDGE * 1.5) / Math.max(base.width, base.height))
    const viewport = page.getViewport({ scale: Math.max(scale, 1) })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    // Fill black first so any unpainted edge is never white.
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvas, canvasContext: context, viewport }).promise
    const trimmed = trimCanvasWhitespace(canvas)
    return normalizeCanvas(trimmed)
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
  return shrinkImageBlob(file, true)
}

/** Trims white page margins from an already stored cover image. */
export async function refineCoverBlob(blob: Blob): Promise<Blob> {
  return shrinkImageBlob(blob, true)
}

async function shrinkImageBlob(blob: Blob, trimWhitespace: boolean): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return blob
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return blob
    context.drawImage(bitmap, 0, 0)
    const source = trimWhitespace ? trimCanvasWhitespace(canvas) : canvas
    return (await normalizeCanvas(source)) ?? blob
  } finally {
    bitmap.close()
  }
}

function trimCanvasWhitespace(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = source.getContext('2d', { willReadFrequently: true })
  if (!context) return source

  const { width, height } = source
  if (width < 8 || height < 8) return source

  const { data } = context.getImageData(0, 0, width, height)
  const isBlankPixel = (x: number, y: number) => {
    const index = (y * width + x) * 4
    const alpha = data[index + 3] ?? 0
    if (alpha < 12) return true
    const red = data[index] ?? 0
    const green = data[index + 1] ?? 0
    const blue = data[index + 2] ?? 0
    // Near-white and very light gray page paper.
    const luma = 0.299 * red + 0.587 * green + 0.114 * blue
    return luma >= WHITE_THRESHOLD && Math.max(red, green, blue) - Math.min(red, green, blue) < 18
  }

  const rowBlankRatio = (y: number) => {
    let blank = 0
    for (let x = 0; x < width; x += 1) {
      if (isBlankPixel(x, y)) blank += 1
    }
    return blank / width
  }

  const columnBlankRatio = (x: number, top: number, bottom: number) => {
    let blank = 0
    const span = bottom - top + 1
    if (span <= 0) return 1
    for (let y = top; y <= bottom; y += 1) {
      if (isBlankPixel(x, y)) blank += 1
    }
    return blank / span
  }

  let top = 0
  let bottom = height - 1
  let left = 0
  let right = width - 1

  while (top < height && rowBlankRatio(top) >= BLANK_ROW_RATIO) top += 1
  while (bottom > top && rowBlankRatio(bottom) >= BLANK_ROW_RATIO) bottom -= 1
  while (left < width && columnBlankRatio(left, top, bottom) >= BLANK_ROW_RATIO) left += 1
  while (right > left && columnBlankRatio(right, top, bottom) >= BLANK_ROW_RATIO) right -= 1

  const foundMargins = top > 0 || left > 0 || bottom < height - 1 || right < width - 1
  if (!foundMargins) return source

  // Only shave 1px of anti-alias after real white margins — never eat cover art.
  const inset = 1
  top = Math.min(bottom, top + inset)
  left = Math.min(right, left + inset)
  bottom = Math.max(top, bottom - inset)
  right = Math.max(left, right - inset)

  const cropWidth = right - left + 1
  const cropHeight = bottom - top + 1
  if (cropWidth < 8 || cropHeight < 8) return source
  if (cropWidth * cropHeight < width * height * 0.18) return source

  const cropped = document.createElement('canvas')
  cropped.width = cropWidth
  cropped.height = cropHeight
  const croppedContext = cropped.getContext('2d')
  if (!croppedContext) return source
  croppedContext.drawImage(source, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
  return cropped
}

async function normalizeCanvas(source: HTMLCanvasElement): Promise<Blob | null> {
  const longest = Math.max(source.width, source.height)
  if (longest <= MAX_COVER_EDGE) {
    return canvasToBlob(source, 'image/jpeg', 0.9)
  }

  const scale = MAX_COVER_EDGE / longest
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return canvasToBlob(source, 'image/jpeg', 0.9)
  context.drawImage(source, 0, 0, width, height)
  return canvasToBlob(canvas, 'image/jpeg', 0.9)
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}
