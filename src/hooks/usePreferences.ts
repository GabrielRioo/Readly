import { use } from 'react'
import { PreferencesContext } from '../preferences/context.ts'

export function usePreferences() {
  return use(PreferencesContext)
}
