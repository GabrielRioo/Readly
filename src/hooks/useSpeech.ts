import { useEffect, useRef, useState } from 'react'
import {
  ONLINE_TTS_FAILED_MESSAGE,
  SpeechPlayer,
  type SpeakResult,
  type SpeechState,
} from '../services/ttsService.ts'

const idle: SpeechState = { status: 'idle', index: 0, total: 0 }

export function useSpeech(rate: number, voiceURI: string) {
  const [state, setState] = useState<SpeechState>(idle)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<SpeechPlayer | null>(null)

  useEffect(() => {
    const player = new SpeechPlayer(setState)
    playerRef.current = player
    return () => {
      player.stop()
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    playerRef.current?.setOptions({ rate, voiceURI })
  }, [rate, voiceURI])

  async function speak(text: string): Promise<SpeakResult> {
    setError(null)
    const result = (await playerRef.current?.speak(text)) ?? 'empty'
    if (result === 'online-failed') setError(ONLINE_TTS_FAILED_MESSAGE)
    return result
  }

  return {
    status: state.status,
    index: state.index,
    total: state.total,
    error,
    clearError: () => setError(null),
    speak,
    pause: () => playerRef.current?.pause(),
    resume: () => playerRef.current?.resume(),
    stop: () => {
      setError(null)
      playerRef.current?.stop()
    },
  }
}
