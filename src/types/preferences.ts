import type { ReaderThemeId } from '../theme/readerThemes.ts'

export interface PreferencesRecord {
  id: 'app'
  theme: ReaderThemeId
  fontSize: number
  lineHeight: number
  speechRate: number
  voiceURI: string
}
