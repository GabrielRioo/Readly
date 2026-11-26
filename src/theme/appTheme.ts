import { createTheme, type ThemeOptions } from '@mui/material/styles'

const shared: ThemeOptions = {
  typography: {
    fontFamily: '"Outfit Variable", "Segoe UI", sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.03em', fontSize: '2rem' },
    h2: { fontWeight: 600, letterSpacing: '-0.03em', fontSize: '1.5rem' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
        contained: {
          boxShadow: 'none',
        },
      },
    },
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

export const appTheme = createTheme({
  ...shared,
  palette: {
    primary: { main: '#1f4d3a' },
    secondary: { main: '#8a5a2b' },
    background: { default: '#e7eee9', paper: '#f7f8f6' },
    text: { primary: '#1a1f1c', secondary: '#5c6560' },
  },
  components: {
    ...shared.components,
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 6px 16px rgba(31, 77, 58, 0.22)' },
        },
      },
    },
  },
})

export const kindleAppTheme = createTheme({
  ...shared,
  palette: {
    primary: { main: '#111111' },
    secondary: { main: '#555555' },
    background: { default: '#e8e8e4', paper: '#f4f4f0' },
    text: { primary: '#111111', secondary: '#666666' },
  },
  components: {
    ...shared.components,
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)' },
        },
      },
    },
  },
})
