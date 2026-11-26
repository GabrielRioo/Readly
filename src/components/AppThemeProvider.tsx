import { CssBaseline, ThemeProvider } from '@mui/material'
import { useEffect, type ReactNode } from 'react'
import { usePreferences } from '../hooks/usePreferences.ts'
import { appThemeFor } from '../theme/appTheme.ts'

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences()
  const theme = appThemeFor(preferences.theme)

  useEffect(() => {
    document.documentElement.dataset.appTheme = preferences.theme
  }, [preferences.theme])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
