export const readerThemeIds = ['default', 'sepia', 'black', 'kindle'] as const

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
  kindle: {
    id: 'kindle',
    label: 'Kindle',
    background: '#f3f1ea',
    text: '#1a1a1a',
    muted: '#5a5a5a',
    accent: '#1a1a1a',
    sheet: '#ebe8e0',
    selection: 'rgba(0, 0, 0, 0.16)',
  },
}

export function isReaderThemeId(value: unknown): value is ReaderThemeId {
  return (
    value === 'default' || value === 'sepia' || value === 'black' || value === 'kindle'
  )
}

export function nextReaderTheme(current: ReaderThemeId): ReaderThemeId {
  const index = readerThemeIds.indexOf(current)
  return readerThemeIds[(index + 1) % readerThemeIds.length] ?? 'default'
}
