import { Alert, Box, FormControlLabel, Radio, RadioGroup, Slider, Typography } from '@mui/material'
import { usePreferences } from '../../hooks/usePreferences.ts'
import {
  ONLINE_ENGLISH_VOICE_LABEL,
  ONLINE_ENGLISH_VOICE_URI,
} from '../../services/ttsService.ts'
import { readerThemeIds, readerThemes, type ReaderThemeId } from '../../theme/readerThemes.ts'
import { useEnglishVoices } from './hooks/useEnglishVoices.ts'

export function SettingsPage() {
  const { preferences, update } = usePreferences()
  const voices = useEnglishVoices()

  return (
    <Box sx={{ px: 2, pt: 'calc(20px + env(safe-area-inset-top))', pb: 4, display: 'grid', gap: 3 }}>
      <Box>
        <Typography variant="h1">Ajustes</Typography>
        <Typography color="text.secondary">Leitura e voz ficam salvas neste aparelho.</Typography>
      </Box>

      <Box>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Tema
        </Typography>
        <RadioGroup
          value={preferences.theme}
          onChange={(event) => update({ theme: event.target.value as ReaderThemeId })}
        >
          {readerThemeIds.map((themeId) => (
            <FormControlLabel key={themeId} value={themeId} control={<Radio />} label={readerThemes[themeId].label} />
          ))}
        </RadioGroup>
      </Box>

      <Box>
        <Typography variant="h2">Texto</Typography>
        <Typography id="font-size-label" sx={{ mt: 1 }}>
          Tamanho: {preferences.fontSize}px
        </Typography>
        <Slider
          aria-labelledby="font-size-label"
          min={16}
          max={28}
          step={1}
          value={preferences.fontSize}
          onChange={(_, value) => update({ fontSize: numberValue(value) })}
        />
        <Typography id="line-height-label">Altura da linha: {preferences.lineHeight.toFixed(2)}</Typography>
        <Slider
          aria-labelledby="line-height-label"
          min={1.4}
          max={2}
          step={0.05}
          value={preferences.lineHeight}
          onChange={(_, value) => update({ lineHeight: numberValue(value) })}
        />
      </Box>

      <Box>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Áudio
        </Typography>
        <Typography id="rate-label">Velocidade: {preferences.speechRate}x</Typography>
        <Slider
          aria-labelledby="rate-label"
          min={0.75}
          max={1.5}
          step={null}
          marks={[
            { value: 0.75, label: '0.75' },
            { value: 1, label: '1' },
            { value: 1.25, label: '1.25' },
            { value: 1.5, label: '1.5' },
          ]}
          value={preferences.speechRate}
          onChange={(_, value) => update({ speechRate: numberValue(value) })}
        />
        <Typography component="label" htmlFor="voice" sx={{ display: 'block', mb: 0.5 }}>
          Voz em inglês
        </Typography>
        <Box
          id="voice"
          component="select"
          value={preferences.voiceURI}
          onChange={(event) => update({ voiceURI: event.target.value })}
          sx={{ minHeight: 44, width: '100%', borderRadius: 1, px: 1, border: '1px solid rgba(26,31,28,0.2)', background: '#fff' }}
        >
          <option value="">
            {voices.length > 0 ? 'Melhor voz local em inglês' : ONLINE_ENGLISH_VOICE_LABEL}
          </option>
          <option value={ONLINE_ENGLISH_VOICE_URI}>{ONLINE_ENGLISH_VOICE_LABEL}</option>
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </Box>
        {voices.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Seu Windows não tem voz em inglês instalada. O app usa a {ONLINE_ENGLISH_VOICE_LABEL.toLowerCase()}
            (precisa de internet). O trecho ouvido é enviado ao Google Translate TTS.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {voices.length} voz(es) locais em inglês. A opção online força pronúncia inglesa mesmo sem pacote do Windows.
          </Typography>
        )}
      </Box>

      <Box>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Privacidade
        </Typography>
        <Typography color="text.secondary">
          Os arquivos ficam no navegador deste aparelho. A frase que você traduz é enviada para o MyMemory.
          Se não houver voz inglesa no Windows, o áudio usa o Google Translate TTS (trecho enviado à internet).
          PDF escaneado, só com imagem, não tem texto para selecionar ou ouvir.
        </Typography>
      </Box>
    </Box>
  )
}

function numberValue(value: number | number[]): number {
  return Array.isArray(value) ? value[0] ?? 0 : value
}
