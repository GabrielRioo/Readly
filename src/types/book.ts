export type BookFormat = 'epub' | 'pdf' | 'txt'

export interface ReadingLocation {
  chapterIndex: number
  page: number
  scrollRatio: number
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
  progress: number
  section: ReaderSection
}
