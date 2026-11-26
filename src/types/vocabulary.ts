export interface VocabularyLocation {
  sectionIndex: number
  startOffset: number
  length: number
}

export interface VocabularyRecord {
  id: string
  source: string
  translation: string
  bookId: string
  bookTitle: string
  createdAt: number
  sectionIndex?: number
  startOffset?: number
  length?: number
}

export interface TranslationCacheRecord {
  key: string
  translation: string
  meanings?: string[]
  createdAt: number
}

export function hasVocabularyLocation(
  entry: VocabularyRecord,
): entry is VocabularyRecord & VocabularyLocation {
  return (
    typeof entry.sectionIndex === 'number' &&
    typeof entry.startOffset === 'number' &&
    typeof entry.length === 'number' &&
    entry.length > 0
  )
}
