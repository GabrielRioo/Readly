export type BookFormat = 'epub' | 'pdf' | 'txt'

export interface ReadingLocation {
  chapterIndex: number
  page: number
  scrollRatio: number
}

export interface ReadingBookmark {
  sectionIndex: number
  startOffset: number
  length: number
  quote: string
  updatedAt: number
}

export interface BookRecord {
  id: string
  title: string
  format: BookFormat
  fileName: string
  size: number
  addedAt: number
  progress: number
  location: ReadingLocation
  bookmark?: ReadingBookmark | null
  blob: Blob
}

export interface BookSummary {
  id: string
  title: string
  format: BookFormat
  fileName: string
  size: number
  addedAt: number
  progress: number
}

export interface ReaderSection {
  index: number
  title: string
  html: string
  text: string
}

export interface OpenedReader {
  id: string
  title: string
  format: BookFormat
  sectionCount: number
  sectionTitles: string[]
  location: ReadingLocation
  bookmark: ReadingBookmark | null
  progress: number
  section: ReaderSection
}
