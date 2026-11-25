import { isReaderThemeId } from '../theme/readerThemes.ts'
import type { PreferencesRecord } from '../types/preferences.ts'
import { clamp } from '../utils/text.ts'
import { db } from './db.ts'

export const defaultPreferences: PreferencesRecord = {
  id: 'app',
  theme: 'default',
  fontSize: 19,
  lineHeight: 1.65,
  speechRate: 1,
  // Empty = local English voice when available, otherwise online English TTS.
  voiceURI: '',
}

export function normalizePreferences(value: Partial<PreferencesRecord> | undefined): PreferencesRecord {
  const speechRate = nearestSpeechRate(value?.speechRate ?? defaultPreferences.speechRate)
  return {
    id: 'app',
    theme: isReaderThemeId(value?.theme) ? value.theme : defaultPreferences.theme,
    fontSize: clamp(value?.fontSize ?? defaultPreferences.fontSize, 16, 28),
    lineHeight: clamp(value?.lineHeight ?? defaultPreferences.lineHeight, 1.4, 2),
    speechRate,
    voiceURI: typeof value?.voiceURI === 'string' ? value.voiceURI : '',
  }
}

export async function getPreferences(): Promise<PreferencesRecord> {
  const stored = await db.preferences.get('app')
  return normalizePreferences(stored)
}

export async function savePreferences(preferences: PreferencesRecord): Promise<void> {
  await db.preferences.put(normalizePreferences(preferences))
}

const speechRates = [0.75, 1, 1.25, 1.5]

function nearestSpeechRate(value: number): number {
  return speechRates.reduce((closest, rate) =>
    Math.abs(rate - value) < Math.abs(closest - value) ? rate : closest,
  )
}
