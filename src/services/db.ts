import Dexie, { type EntityTable } from 'dexie'
import type { BookRecord } from '../types/book.ts'
import type { PreferencesRecord } from '../types/preferences.ts'
import type { TranslationCacheRecord, VocabularyRecord } from '../types/vocabulary.ts'

class ReaderDatabase extends Dexie {
  books!: EntityTable<BookRecord, 'id'>
  preferences!: EntityTable<PreferencesRecord, 'id'>
  vocabulary!: EntityTable<VocabularyRecord, 'id'>
  translations!: EntityTable<TranslationCacheRecord, 'key'>

  constructor() {
    super('leitor-ingles')
    this.version(1).stores({
      books: 'id, addedAt, title',
      preferences: 'id',
      vocabulary: 'id, createdAt, source',
      translations: 'key',
    })
    this.version(2).stores({
      books: 'id, addedAt, title',
      preferences: 'id',
      vocabulary: 'id, createdAt, source, bookId',
      translations: 'key',
    })
  }
}

export const db = new ReaderDatabase()
