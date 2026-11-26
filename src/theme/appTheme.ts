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
  extras?: ThemeOptions['components'],
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
            backgroundColor: mode === 'dark' ? 'rgba(18, 20, 23, 0.96)' : 'rgba(247, 248, 246, 0.96)',
          },
        },
      },
      ...extras,
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

/** E-ink Kindle look: warm paper, pure black ink, no color accents. */
export const kindleAppTheme = buildTheme(
  {
    primary: { main: '#1a1a1a', contrastText: '#f3f1ea' },
    secondary: { main: '#5a5a5a' },
    divider: '#c9c5bb',
    background: { default: '#ebe8e0', paper: '#f3f1ea' },
    text: { primary: '#1a1a1a', secondary: '#4f4f4f' },
    action: {
      active: '#1a1a1a',
      hover: 'rgba(0, 0, 0, 0.06)',
      selected: 'rgba(0, 0, 0, 0.1)',
    },
  },
  'none',
  'light',
  {
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#f3f1ea',
          borderTop: '1px solid #c9c5bb',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#5a5a5a',
          '&.Mui-selected': { color: '#1a1a1a' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#f3f1ea',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bdb9af' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8f8b82' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1a1a1a' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
        contained: {
          boxShadow: 'none',
          backgroundColor: '#1a1a1a',
          color: '#f3f1ea',
          '&:hover': { backgroundColor: '#000', boxShadow: 'none' },
        },
        outlined: {
          borderColor: '#bdb9af',
          color: '#1a1a1a',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 44,
          height: 44,
          color: '#1a1a1a',
          borderColor: '#bdb9af',
        },
      },
    },
  },
)

export function appThemeFor(themeId: ReaderThemeId): Theme {
  if (themeId === 'sepia') return sepiaAppTheme
  if (themeId === 'black') return blackAppTheme
  if (themeId === 'kindle') return kindleAppTheme
  return appTheme
}
