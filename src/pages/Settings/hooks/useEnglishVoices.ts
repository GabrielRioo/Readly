import { useEffect, useState } from 'react'
import { listEnglishVoices, whenEnglishVoicesReady } from '../../../services/ttsService.ts'

export function useEnglishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const load = () => setVoices(listEnglishVoices())
    load()
    void whenEnglishVoicesReady().then(setVoices)
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  return voices
}
