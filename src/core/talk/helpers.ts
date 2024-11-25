import {type AzureVoiceInfo} from './types'

export const DEFAULT_VOICE = `en-AU-WilliamNeural`

export function getAttributes(element: Element) {
  const attributes = element.attributes
  const result: {
    [key: string]: string
  } = {}

  for (let attr of attributes) {
    result[attr.name] = attr.value
  }

  return result
}

export const regStripStrings = /[^-\d.]/g

export const stripStrings = (str: string | undefined, def: string | number) => {
  if (str) return str.replace(regStripStrings, '')
  else return def
}

export const AddEvent = (detail = {}, key = 'clicked_edit') =>
  new CustomEvent(key, {
    detail,
    bubbles: true,
    composed: true, // Allows the event to pass through the shadow DOM boundary
  })

export const VOICES = 'get_ms_voices'

export const dog = {
  [VOICES]: (function () {
    let _t = localStorage.getItem(VOICES)
    if (_t) return JSON.parse(_t) as AzureVoiceInfo[]
    return null
  })(),
}

export async function getMicrosoftVoices() {
  if (dog[VOICES]) return dog[VOICES]
  const response = await fetch('/api/polly/list_m')
  const _voices: AzureVoiceInfo[] = await response.json()

  const voices = _voices
    .filter(item => {
      return item.Locale.startsWith('en-')
    })
    .filter(item => {
      return !item.Name.includes('Multilingual')
    })

  voices.forEach(item => {
    item.Face = makeFace(item.LocalName)
    return item
  })

  localStorage.setItem(VOICES, JSON.stringify(voices))
  return (dog[VOICES] = voices)
}

function makeFace(name: string) {
  return `https://api.multiavatar.com/${name}.png`
}
