import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles'
import type { ReaderThemeId } from './readerThemes.ts'

const shared: ThemeOptions = {
  typography: {
    fontFamily: '"Outfit Variable", "Segoe UI", sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.03em', fontSize: '2rem' },
    h2: { fontWeight: 600, letterSpacing: '-0.03em', fontSize: '1.5rem' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiIconButton: {
      styleOverrides: {
        root: { width: 44, height: 44 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
  },
}

function buildTheme(
  palette: ThemeOptions['palette'],
  hoverShadow: string,
  mode: 'light' | 'dark' = 'light',
): Theme {
  return createTheme({
    ...shared,
    palette: {
      mode,
      ...palette,
    },
    components: {
      ...shared.components,
      MuiButton: {
        styleOverrides: {
          root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: hoverShadow },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? 'rgba(18, 20, 23, 0.92)' : 'rgba(247, 248, 246, 0.92)',
          },
        },
      },
    },
  })
}

export const appTheme = buildTheme(
  {
    primary: { main: '#1f4d3a' },
    secondary: { main: '#8a5a2b' },
    background: { default: '#e7eee9', paper: '#f7f8f6' },
    text: { primary: '#1a1f1c', secondary: '#5c6560' },
  },
  '0 6px 16px rgba(31, 77, 58, 0.22)',
)

export const sepiaAppTheme = buildTheme(
  {
    primary: { main: '#8a5a2b' },
    secondary: { main: '#6d5644' },
    background: { default: '#efe3cf', paper: '#fff6e8' },
    text: { primary: '#3e2f1c', secondary: '#6d5644' },
  },
  '0 6px 16px rgba(138, 90, 43, 0.22)',
)

export const blackAppTheme = buildTheme(
  {
    primary: { main: '#d7b07a' },
    secondary: { main: '#a39e93' },
    background: { default: '#121417', paper: '#1c2128' },
    text: { primary: '#e7e2d6', secondary: '#a39e93' },
  },
  '0 6px 16px rgba(0, 0, 0, 0.35)',
  'dark',
)

export const kindleAppTheme = buildTheme(
  {
    primary: { main: '#111111' },
    secondary: { main: '#555555' },
    background: { default: '#e8e8e4', paper: '#f4f4f0' },
    text: { primary: '#111111', secondary: '#666666' },
  },
  '0 6px 16px rgba(0, 0, 0, 0.18)',
)

export function appThemeFor(themeId: ReaderThemeId): Theme {
  if (themeId === 'sepia') return sepiaAppTheme
  if (themeId === 'black') return blackAppTheme
  if (themeId === 'kindle') return kindleAppTheme
  return appTheme
}
