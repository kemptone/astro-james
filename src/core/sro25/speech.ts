import type {Provider, TourSettings} from './settings'

export type TourVoice = {
  id: string
  name: string
  engine?: string
  locale?: string
  gender?: string
  unavailable?: boolean
}

async function getJSON(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {signal})
  if (!response.ok)
    throw new Error('Could not load voices. Try again or choose Native.')
  return response.json()
}

export async function loadVoices(
  provider: Provider,
  signal?: AbortSignal,
): Promise<TourVoice[]> {
  if (provider === 'native') {
    return (
      window.speechSynthesis
        ?.getVoices()
        .map(voice => ({
          id: voice.voiceURI,
          name: `${voice.name} (${voice.lang})`,
        })) || []
    )
  }
  if (provider === 'chatgpt') {
    // Voices supported by the existing tts-1 endpoint.
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map(id => ({
      id,
      name: id,
    }))
  }
  if (provider === 'wrapper') {
    // These are requested legacy choices, not a claim that a complete service is connected.
    return ['Audrey', 'Brian', 'Emma', 'Nicole', 'Joey'].map(name => ({
      id: name,
      name: `${name} — not connected`,
      unavailable: true,
    }))
  }
  if (provider === 'amazon') {
    const data = await getJSON('/api/polly/list', signal)
    if (!Array.isArray(data.Voices))
      throw new Error(
        'Amazon voices are unavailable. Try Native or reload voices.',
      )
    return data.Voices.map(voice => ({
      id: voice.Id,
      name: `${voice.Name} (${voice.LanguageCode})`,
      engine: voice.SupportedEngines?.includes('standard')
        ? 'standard'
        : voice.SupportedEngines?.[0],
    }))
  }
  const data = await getJSON('/api/polly/list_m', signal)
  if (!Array.isArray(data))
    throw new Error(
      'Microsoft voices are unavailable. Try Native or reload voices.',
    )
  return data.map(voice => ({
    id: voice.ShortName,
    name: `${voice.DisplayName || voice.LocalName} (${voice.Locale})`,
    locale: voice.Locale,
    gender: voice.Gender,
  }))
}

export class TourSpeech {
  private request?: AbortController
  private audio?: HTMLAudioElement
  private audioURL?: string
  private generation = 0

  stop() {
    this.generation++
    this.request?.abort()
    this.request = undefined
    window.speechSynthesis?.cancel()
    this.audio?.pause()
    this.audio = undefined
    if (this.audioURL) URL.revokeObjectURL(this.audioURL)
    this.audioURL = undefined
  }

  async speak(
    text: string,
    settings: TourSettings,
    voice: TourVoice | undefined,
    report: (message: string) => void,
  ) {
    this.stop()
    const generation = this.generation
    const status = (message: string) => {
      if (generation === this.generation) report(message)
    }
    if (!voice || voice.unavailable) {
      status(
        settings.provider === 'wrapper'
          ? 'Wrapper Offline is not connected. Choose another talker to hear the tour.'
          : 'Select an available voice first.',
      )
      return
    }
    if (settings.provider === 'native') {
      const native = window.speechSynthesis
        ?.getVoices()
        .find(item => item.voiceURI === voice.id)
      if (!native) {
        status(
          'This voice is no longer available. Reload voices and choose another.',
        )
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = native
      utterance.rate = settings.rate
      utterance.onend = () => status('Ready')
      utterance.onerror = event =>
        status(`Speech stopped: ${event.error}. Try Preview again.`)
      status('Speaking…')
      window.speechSynthesis.speak(utterance)
      return
    }
    this.request = new AbortController()
    const request = this.request
    const timeout = window.setTimeout(() => request.abort(), 30000)
    const endpoint =
      settings.provider === 'chatgpt'
        ? '/api/openai/openai_texttospeech'
        : settings.provider === 'amazon'
          ? '/api/polly/say'
          : '/api/polly/say_m'
    try {
      status('Loading speech…')
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: request.signal,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          text,
          voice: voice.id,
          engine: voice.engine,
          Locale: voice.locale,
          Gender: voice.gender,
        }),
      })
      if (
        !response.ok ||
        !response.headers.get('Content-Type')?.startsWith('audio/')
      )
        throw new Error(
          'Voice preview failed. Choose another voice or try Native.',
        )
      const blob = await response.blob()
      if (generation !== this.generation) return
      this.audioURL = URL.createObjectURL(blob)
      const audio = new Audio(this.audioURL)
      this.audio = audio
      audio.playbackRate = settings.rate
      audio.onended = () => {
        if (generation === this.generation) {
          this.stop()
          report('Ready')
        }
      }
      audio.onerror = () => {
        if (generation === this.generation) {
          this.stop()
          report('This audio could not play. Try another voice.')
        }
      }
      await audio.play()
      status('Speaking…')
    } catch (error) {
      if (generation !== this.generation) return
      this.stop()
      report(
        error instanceof Error && error.name !== 'AbortError'
          ? error.message
          : 'Speech timed out. Try again or choose Native.',
      )
    } finally {
      clearTimeout(timeout)
    }
  }
}
