import type { BookFormat } from '../types/book.ts'

const MAX_BYTES = 50 * 1024 * 1024

const FORMAT_BY_EXTENSION: Record<string, BookFormat> = {
  epub: 'epub',
  pdf: 'pdf',
  txt: 'txt',
}

export async function validateBookFile(file: File): Promise<BookFormat> {
  if (file.size <= 0) throw new Error('O arquivo está vazio.')
  if (file.size > MAX_BYTES) throw new Error('O arquivo passa de 50 MB.')

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const format = FORMAT_BY_EXTENSION[extension]
  if (!format) throw new Error('Use um arquivo EPUB, PDF ou TXT.')

  const header = new Uint8Array(await file.slice(0, 512).arrayBuffer())
  if (format === 'pdf' && !startsWith(header, [0x25, 0x50, 0x44, 0x46])) {
    throw new Error('Esse PDF não parece válido.')
  }
  if (format === 'epub' && !isZip(header)) {
    throw new Error('Esse EPUB não parece válido.')
  }
  if (format === 'txt' && !looksLikeText(header)) {
    throw new Error('Esse TXT não parece texto.')
  }

  return format
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value)
}

function isZip(bytes: Uint8Array): boolean {
  return (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  )
}

function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false
  if (isZip(bytes) || startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return false

  const utf16 =
    startsWith(bytes, [0xff, 0xfe]) || startsWith(bytes, [0xfe, 0xff])
  if (utf16) return true

  return !bytes.includes(0)
}
