import { useEffect, useState, type ReactNode } from 'react'
import { PreferencesContext } from '../preferences/context.ts'
import {
  defaultPreferences,
  getPreferences,
  normalizePreferences,
  savePreferences,
} from '../services/preferencesStorage.ts'
import type { PreferencesRecord } from '../types/preferences.ts'

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<PreferencesRecord>(defaultPreferences)

  useEffect(() => {
    let active = true
    getPreferences()
      .then((stored) => {
        if (active) setPreferences(stored)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  function update(patch: Partial<Omit<PreferencesRecord, 'id'>>) {
    setPreferences((current) => {
      const next = normalizePreferences({ ...current, ...patch, id: 'app' })
      void savePreferences(next)
      return next
    })
  }

  return <PreferencesContext value={{ preferences, update }}>{children}</PreferencesContext>
}
