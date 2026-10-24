export const SETTINGS_KEY = 'sro25.discovery-tour'
export const SETTINGS_EVENT = 'sro25-settings-changed'
export type Provider = 'native' | 'chatgpt' | 'amazon' | 'microsoft' | 'wrapper'
export type TourSettings = {
  enabled: boolean
  provider: Provider
  voice: string
  rate: number
  behavior: 'questions' | 'explain' | 'quiet'
}

export const defaults: TourSettings = {
  enabled: false,
  provider: 'native',
  voice: '',
  rate: 1,
  behavior: 'questions',
}

export function readSettings(): TourSettings {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      enabled: value.enabled === true,
      provider: [
        'native',
        'chatgpt',
        'amazon',
        'microsoft',
        'wrapper',
      ].includes(value.provider)
        ? value.provider
        : defaults.provider,
      voice: typeof value.voice === 'string' ? value.voice : '',
      rate: Number.isFinite(value.rate)
        ? Math.max(0.5, Math.min(2, value.rate))
        : 1,
      behavior: ['questions', 'explain', 'quiet'].includes(value.behavior)
        ? value.behavior
        : defaults.behavior,
    }
  } catch {
    return {...defaults}
  }
}

export function saveSettings(settings: TourSettings) {
  // Storage failures are shown by the settings UI; do not pretend they saved.
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}
