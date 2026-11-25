export const readerThemeIds = ['default', 'sepia', 'black'] as const

export type ReaderThemeId = (typeof readerThemeIds)[number]

export interface ReaderTheme {
  id: ReaderThemeId
  label: string
  background: string
  text: string
  muted: string
  accent: string
  sheet: string
  selection: string
}

export const readerThemes: Record<ReaderThemeId, ReaderTheme> = {
  default: {
    id: 'default',
    label: 'Padrão',
    background: '#f7f8f6',
    text: '#1a1f1c',
    muted: '#5c6560',
    accent: '#1f4d3a',
    sheet: '#ffffff',
    selection: 'rgba(31, 77, 58, 0.22)',
  },
  sepia: {
    id: 'sepia',
    label: 'Sépia',
    background: '#f3e6d0',
    text: '#3e2f1c',
    muted: '#6d5644',
    accent: '#8a5a2b',
    sheet: '#fff6e8',
    selection: 'rgba(138, 90, 43, 0.28)',
  },
  black: {
    id: 'black',
    label: 'Preto',
    background: '#121417',
    text: '#e7e2d6',
    muted: '#a39e93',
    accent: '#d7b07a',
    sheet: '#1c2128',
    selection: 'rgba(215, 176, 122, 0.35)',
  },
}

export function isReaderThemeId(value: unknown): value is ReaderThemeId {
  return value === 'default' || value === 'sepia' || value === 'black'
}

export function nextReaderTheme(current: ReaderThemeId): ReaderThemeId {
  const index = readerThemeIds.indexOf(current)
  return readerThemeIds[(index + 1) % readerThemeIds.length] ?? 'default'
}
