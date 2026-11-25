import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    primary: { main: '#1f4d3a' },
    secondary: { main: '#8a5a2b' },
    background: { default: '#e4ebe6', paper: '#f7f8f6' },
    text: { primary: '#1a1f1c', secondary: '#5c6560' },
  },
  typography: {
    fontFamily: '"Outfit Variable", "Segoe UI", sans-serif',
    h1: { fontWeight: 600, letterSpacing: '-0.03em', fontSize: '2rem' },
    h2: { fontWeight: 600, letterSpacing: '-0.03em', fontSize: '1.5rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { width: 44, height: 44 },
      },
    },
  },
})
