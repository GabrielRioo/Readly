import { createContext } from 'react'
import type { PreferencesRecord } from '../types/preferences.ts'
import { defaultPreferences } from '../services/preferencesStorage.ts'

export interface PreferencesContextValue {
  preferences: PreferencesRecord
  update: (patch: Partial<Omit<PreferencesRecord, 'id'>>) => void
}

export const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: defaultPreferences,
  update: () => undefined,
})
