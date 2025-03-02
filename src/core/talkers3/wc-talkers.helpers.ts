import {type AzureVoiceInfo} from './types'
import {VoiceId, type DescribeVoicesCommandOutput} from '@aws-sdk/client-polly'

const VOICES = 'get_ms_voices'
const AMAZON_VOICES = 'get_voices'

const dog = {
  [VOICES]: (function () {
    let _t = localStorage.getItem(VOICES)
    if (_t) return JSON.parse(_t) as AzureVoiceInfo[]
    return null
  })(),
  [AMAZON_VOICES]: (function () {
    let _t = localStorage.getItem(AMAZON_VOICES)
    if (_t) return JSON.parse(_t) as DescribeVoicesCommandOutput
    return null
  })(),
}

export async function getAmazonVoices() {
  if (dog[AMAZON_VOICES]) return dog[AMAZON_VOICES]
  const response = await fetch('/api/polly/list')
  const json = (await response.json()) as DescribeVoicesCommandOutput

  json.Voices = json.Voices?.filter?.(item => {
    return item.LanguageCode?.startsWith('en')
  })

  json.Voices?.forEach(item => {
    item.Face = makeFace(item.Name || '')
    return item
  })

  localStorage.setItem(AMAZON_VOICES, JSON.stringify(json))
  return (dog[AMAZON_VOICES] = json)
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
    item.Face = makeFace(item.ShortName)
    return item
  })

  localStorage.setItem(VOICES, JSON.stringify(voices))
  return (dog[VOICES] = voices)
}

function makeFace(name: string) {
  return `https://api.dicebear.com/9.x/croodles-neutral/svg?seed=${name}`
}

export type AITalker = {
  text: string
  voice: string
  engine?: string
}

export async function playVoices(
  formProps: AITalker[],
  postSpeech: (props: AITalker) => Promise<Response>
) {
  // Get all the OpenAISpeech responses concurrently.
  const responses = await Promise.all(formProps.map(postSpeech))

  // Convert responses into audio elements concurrently.
  const audios = await Promise.all(
    responses.map(async response => {
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      return new Audio(audioUrl)
    })
  )

  // Helper: Returns a promise that resolves when the audio ends.
  const playAudio = (audio: HTMLAudioElement) =>
    new Promise<void>(resolve => {
      audio.addEventListener('ended', resolve, {once: true})
      audio.play()
    })

  // Play all audios sequentially.
  for (const audio of audios) {
    await playAudio(audio)
  }
}
