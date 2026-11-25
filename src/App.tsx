import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material'
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx'
import { AppShell } from './components/AppShell.tsx'
import { PreferencesProvider } from './components/PreferencesProvider.tsx'
import { LibraryPage } from './pages/Library/index.tsx'
import { SettingsPage } from './pages/Settings/index.tsx'
import { VocabularyPage } from './pages/Vocabulary/index.tsx'
import { appTheme } from './theme/appTheme.ts'

const ReaderPage = lazy(() => import('./pages/Reader/index.tsx').then((module) => ({ default: module.ReaderPage })))

export function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppErrorBoundary>
        <PreferencesProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<LibraryPage />} />
                <Route path="/vocabulary" element={<VocabularyPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route
                path="/read/:bookId"
                element={
                  <Suspense
                    fallback={
                      <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
                        <CircularProgress />
                      </Box>
                    }
                  >
                    <ReaderPage />
                  </Suspense>
                }
              />
            </Routes>
          </BrowserRouter>
        </PreferencesProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  )
}
