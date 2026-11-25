export interface VocabularyRecord {
  id: string
  source: string
  translation: string
  bookId: string
  bookTitle: string
  createdAt: number
}

export interface TranslationCacheRecord {
  key: string
  translation: string
  createdAt: number
}
