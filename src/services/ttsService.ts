export interface SpeechOptions {
  rate: number
  voiceURI: string
}

export interface SpeechState {
  status: 'idle' | 'playing' | 'paused'
  index: number
  total: number
}

export type SpeakResult = 'started' | 'empty' | 'online-failed'

/** Synthetic option: English voice via Google Translate TTS (needs internet). */
export const ONLINE_ENGLISH_VOICE_URI = 'online:en'

export const ONLINE_ENGLISH_VOICE_LABEL = 'Voz online em inglês (Google)'

export const ONLINE_TTS_FAILED_MESSAGE =
  'Não deu para tocar a voz online em inglês. Confira a internet e tente de novo. Sem voz inglesa instalada no Windows, o navegador só tem português.'

const LOCAL_CHUNK_LIMIT = 220
const ONLINE_CHUNK_LIMIT = 180
const VOICE_WAIT_MS = 2500

export function splitForSpeech(text: string, limit = LOCAL_CHUNK_LIMIT): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [cleaned]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const part = sentence.trim()
    if (!part) continue
    if (part.length > limit) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      chunks.push(...splitLongPart(part, limit))
      continue
    }
    const next = current ? `${current} ${part}` : part
    if (next.length > limit && current) {
      chunks.push(current)
      current = part
    } else {
      current = next
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function splitLongPart(text: string, limit: number): string[] {
  const words = text.split(' ')
  const parts: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > limit && current) {
      parts.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) parts.push(current)
  return parts
}

export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  return window.speechSynthesis
    .getVoices()
    .filter(isEnglishVoice)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase().replace('_', '-')
  if (lang.startsWith('en')) return true
  return (
    /\ben(-|_)?(us|gb|au|in|ie|za)?\b|english|americano|brit[aá]nic/i.test(voice.name) &&
    !/portugu|brazil|brasil|pt[-_]?br/i.test(voice.name)
  )
}

export function resolveEnglishVoice(voiceURI: string): SpeechSynthesisVoice | undefined {
  if (voiceURI === ONLINE_ENGLISH_VOICE_URI) return undefined
  const voices = listEnglishVoices()
  if (voices.length === 0) return undefined

  const selected = voiceURI ? voices.find((voice) => voice.voiceURI === voiceURI) : undefined
  if (selected) return selected
  if (voiceURI) return undefined

  return voices
    .slice()
    .sort((a, b) => englishVoiceScore(b) - englishVoiceScore(a))[0]
}

function englishVoiceScore(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase().replace('_', '-')
  let score = 0
  if (lang.startsWith('en-us')) score += 40
  else if (lang.startsWith('en-gb')) score += 30
  else if (lang.startsWith('en')) score += 20
  if (/google/i.test(voice.name) && !voice.localService) score += 25
  if (voice.localService) score += 10
  if (/natural|neural|online/i.test(voice.name)) score += 10
  if (/microsoft|apple|samantha|aria|jenny|zira|david/i.test(voice.name)) score += 5
  if (/portugu|brazil|brasil/i.test(voice.name)) score -= 100
  return score
}

export function whenEnglishVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve([])

  const existing = listEnglishVoices()
  if (existing.length > 0) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const finish = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange)
      window.clearTimeout(timeout)
      resolve(listEnglishVoices())
    }
    const onChange = () => {
      if (listEnglishVoices().length > 0) finish()
    }
    const timeout = window.setTimeout(finish, VOICE_WAIT_MS)
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    window.speechSynthesis.getVoices()
  })
}

function shouldUseOnlineVoice(voiceURI: string, hasLocalEnglish: boolean): boolean {
  if (voiceURI === ONLINE_ENGLISH_VOICE_URI) return true
  if (!hasLocalEnglish) return true
  return false
}

function onlineTtsUrl(text: string): string {
  const params = new URLSearchParams({
    ie: 'UTF-8',
    client: 'tw-ob',
    tl: 'en',
    q: text,
  })
  return `https://translate.google.com/translate_tts?${params.toString()}`
}

export class SpeechPlayer {
  private chunks: string[] = []
  private index = 0
  private stopped = true
  private utteranceId = 0
  private mode: 'local' | 'online' = 'local'
  private audio: HTMLAudioElement | null = null
  private chunkWait: { resolve: () => void; reject: (error: Error) => void } | null = null
  private options: SpeechOptions = { rate: 1, voiceURI: '' }
  private state: SpeechState = { status: 'idle', index: 0, total: 0 }
  private readonly onChange: (state: SpeechState) => void

  constructor(onChange: (state: SpeechState) => void) {
    this.onChange = onChange
  }

  get status(): SpeechState['status'] {
    return this.state.status
  }

  setOptions(options: SpeechOptions): void {
    this.options = options
  }

  async speak(text: string): Promise<SpeakResult> {
    this.invalidate()
    const voices = await whenEnglishVoicesReady()
    const useOnline = shouldUseOnlineVoice(this.options.voiceURI, voices.length > 0)
    this.mode = useOnline ? 'online' : 'local'
    this.chunks = splitForSpeech(text, useOnline ? ONLINE_CHUNK_LIMIT : LOCAL_CHUNK_LIMIT)
    this.index = 0
    this.stopped = this.chunks.length === 0
    if (this.stopped) {
      this.emit({ status: 'idle', index: 0, total: 0 })
      return 'empty'
    }

    const run = this.utteranceId
    await wait(40)
    if (this.stopped || this.utteranceId !== run) return 'empty'

    if (this.mode === 'online') {
      try {
        await this.speakOnlineCurrent(run)
        return 'started'
      } catch {
        this.stopped = true
        this.chunks = []
        this.emit({ status: 'idle', index: 0, total: 0 })
        return 'online-failed'
      }
    }

    if (!resolveEnglishVoice(this.options.voiceURI)) {
      // Local selection vanished; fall back to online English.
      this.mode = 'online'
      this.chunks = splitForSpeech(text, ONLINE_CHUNK_LIMIT)
      try {
        await this.speakOnlineCurrent(run)
        return 'started'
      } catch {
        this.stopped = true
        this.chunks = []
        this.emit({ status: 'idle', index: 0, total: 0 })
        return 'online-failed'
      }
    }

    this.speakLocalCurrent()
    return 'started'
  }

  pause(): void {
    if (this.state.status !== 'playing') return
    if (this.mode === 'online') {
      this.audio?.pause()
      this.emit({ status: 'paused', index: this.index, total: this.chunks.length })
      return
    }
    this.stopped = true
    this.invalidate()
    this.emit({ status: 'paused', index: this.index, total: this.chunks.length })
  }

  resume(): void {
    if (this.state.status !== 'paused') return
    if (this.mode === 'online') {
      if (this.audio && !this.audio.ended) {
        void this.audio.play().then(() => {
          this.emit({ status: 'playing', index: this.index, total: this.chunks.length })
        })
        return
      }
      this.stopped = false
      const run = this.utteranceId
      void this.speakOnlineCurrent(run).catch(() => {
        this.stopped = true
        this.emit({ status: 'idle', index: this.index, total: this.chunks.length })
      })
      return
    }
    this.stopped = false
    void wait(50).then(() => this.speakLocalCurrent())
  }

  stop(): void {
    this.stopped = true
    this.chunks = []
    this.index = 0
    this.invalidate()
    this.emit({ status: 'idle', index: 0, total: 0 })
  }

  private invalidate(): void {
    this.utteranceId += 1
    if (this.chunkWait) {
      const wait = this.chunkWait
      this.chunkWait = null
      wait.resolve()
    }
    if (this.audio) {
      this.audio.onended = null
      this.audio.onerror = null
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
      this.audio = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  private speakLocalCurrent(): void {
    if (this.stopped || this.index >= this.chunks.length) {
      this.stopped = true
      this.emit({ status: 'idle', index: 0, total: this.chunks.length })
      return
    }

    const voice = resolveEnglishVoice(this.options.voiceURI)
    if (!voice) {
      this.stopped = true
      this.emit({ status: 'idle', index: this.index, total: this.chunks.length })
      return
    }

    const id = ++this.utteranceId
    const utterance = new SpeechSynthesisUtterance(this.chunks[this.index])
    utterance.rate = this.options.rate
    utterance.voice = voice
    utterance.lang = voice.lang || 'en-US'

    utterance.onend = () => {
      if (this.stopped || id !== this.utteranceId) return
      this.index += 1
      this.speakLocalCurrent()
    }
    utterance.onerror = () => {
      if (this.stopped || id !== this.utteranceId) return
      this.stopped = true
      this.emit({ status: 'idle', index: this.index, total: this.chunks.length })
    }

    this.emit({ status: 'playing', index: this.index, total: this.chunks.length })
    window.speechSynthesis.speak(utterance)
  }

  private async speakOnlineCurrent(run: number): Promise<void> {
    if (this.stopped || this.utteranceId !== run) return
    if (this.index >= this.chunks.length) {
      this.stopped = true
      this.emit({ status: 'idle', index: 0, total: this.chunks.length })
      return
    }

    const text = this.chunks[this.index]
    const audio = new Audio()
    audio.setAttribute('referrerpolicy', 'no-referrer')
    audio.preload = 'auto'
    audio.src = onlineTtsUrl(text)
    audio.playbackRate = clampRate(this.options.rate)
    this.audio = audio

    this.emit({ status: 'playing', index: this.index, total: this.chunks.length })

    await new Promise<void>((resolve, reject) => {
      this.chunkWait = { resolve, reject }
      audio.onended = () => {
        this.chunkWait = null
        resolve()
      }
      audio.onerror = () => {
        this.chunkWait = null
        reject(new Error('online-tts-failed'))
      }
      void audio.play().catch((error) => {
        this.chunkWait = null
        reject(error instanceof Error ? error : new Error('online-tts-failed'))
      })
    })

    if (this.stopped || this.utteranceId !== run) return
    this.index += 1
    await this.speakOnlineCurrent(run)
  }

  private emit(state: SpeechState): void {
    this.state = state
    this.onChange(state)
  }
}

function clampRate(rate: number): number {
  return Math.min(1.5, Math.max(0.75, rate))
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
