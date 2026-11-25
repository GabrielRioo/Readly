import ePub from 'epubjs'
import type { Book, NavItem } from 'epubjs'
import type { ReaderSection } from '../types/book.ts'
import { sanitizeBookHtml } from '../utils/sanitizeHtml.ts'
import { htmlToPlainText } from '../utils/text.ts'

interface SpineSection {
  href: string
  linear: boolean
  document: Document
  load: (request?: (path: string) => Promise<object>) => Promise<unknown>
  unload: () => void
}

export interface ParsedEpub {
  book: Book
  sections: SpineSection[]
  titles: string[]
}

export async function readEpubTitle(data: ArrayBuffer): Promise<string> {
  const book = await openEpub(data)
  try {
    const metadata = await book.loaded.metadata
    return metadata.title?.trim() ?? ''
  } finally {
    book.destroy()
  }
}

export async function parseEpub(data: ArrayBuffer): Promise<ParsedEpub> {
  const book = await openEpub(data)
  try {
    const navigation = await book.loaded.navigation.catch(() => null)
    const labels = labelMap(navigation?.toc ?? [])
    const sections = readableSections(book)
    const titles = sections.map((section, index) => labels.get(hrefKey(section.href)) || `Capítulo ${index + 1}`)
    return { book, sections, titles }
  } catch (error) {
    book.destroy()
    throw error
  }
}

async function openEpub(data: ArrayBuffer): Promise<Book> {
  const book = ePub({} as unknown as string)
  try {
    await book.open(data as unknown as string)
    await book.loaded.metadata
    await book.loaded.spine
    await book.loaded.navigation.catch(() => undefined)
    return book
  } catch {
    book.destroy()
    throw new Error('Não foi possível ler este EPUB.')
  }
}

function readableSections(book: Book): SpineSection[] {
  const spine = book.spine as unknown as { spineItems?: SpineSection[] }
  const items = spine.spineItems ?? []
  const linear = items.filter((item) => item.linear)
  return linear.length > 0 ? linear : items
}

function labelMap(items: NavItem[]): Map<string, string> {
  const labels = new Map<string, string>()
  const visit = (nodes: NavItem[]) => {
    for (const node of nodes) {
      const label = node.label?.replace(/\s+/g, ' ').trim()
      if (node.href && label) labels.set(hrefKey(node.href), label)
      if (node.subitems) visit(node.subitems)
    }
  }
  visit(items)
  return labels
}

function hrefKey(href: string): string {
  const path = href.split('#')[0] ?? href
  const last = path.split('/').pop() ?? path
  try {
    return decodeURIComponent(last).toLowerCase()
  } catch {
    return last.toLowerCase()
  }
}

export async function loadEpubSection(
  parsed: ParsedEpub,
  index: number,
): Promise<ReaderSection> {
  const section = parsed.sections[index]
  const title = parsed.titles[index] ?? `Capítulo ${index + 1}`
  if (!section) {
    return emptySection(index, title)
  }

  try {
    await section.load(parsed.book.load.bind(parsed.book))
    const body = section.document?.body ?? section.document?.documentElement
    const sanitized = sanitizeBookHtml(body?.innerHTML ?? '')
    const text = htmlToPlainText(sanitized)
    section.unload()
    if (!text) return emptySection(index, title)
    return { index, title, html: sanitized, text }
  } catch {
    return emptySection(index, title)
  }
}

function emptySection(index: number, title: string): ReaderSection {
  const text = 'Este trecho não tem texto selecionável.'
  return { index, title, html: `<p>${text}</p>`, text }
}
