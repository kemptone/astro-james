import {VoiceId} from '@aws-sdk/client-polly'
import {type AzureVoiceInfo} from './types'

const VOICES = 'get_ms_voices'

const dog = {
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
    item.Face = makeFace(item.ShortName)
    return item
  })

  localStorage.setItem(VOICES, JSON.stringify(voices))
  return (dog[VOICES] = voices)
}

function makeFace(name: string) {
  return `https://api.dicebear.com/9.x/croodles-neutral/svg?seed=${name}`
}

export type FormType = {
  voiceId: VoiceId
  text: string
  text_hidden?: string
  engine: string
}

export const playText = async (
  form: {
    values: FormType
  },
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: form.values.text || form.values.text_hidden,
      voiceId: form.values.voiceId,
      engine: form.values.engine,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

export const playMeme = async ({audio}: {audio: string}) => {
  const response = await fetch('/api/get_meme', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio }),
  })
  if (!response.ok) throw new Error('Failed to fetch MP3')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  return new Audio(url)
}

export const playTextAzure = async (
  form: {
    values: AzureVoiceInfo & {
      text?: string
      text_hidden?: string
      express_as?: string
    }
  },
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say_m', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...form.values,
      text: form.values.text || form.values.text_hidden,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

export const playSSMLAzure = async (
  form: {
    values: {ssml: string}
  },
  should_play: boolean
) => {
  const response = await fetch('/api/polly/say_m2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(form.values),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch audio')
  }

  // Read the response body as a ReadableStream
  const reader = response.body?.getReader()
  const chunks = []

  // Read chunks of data from the stream
  while (true) {
    const {done, value} = await reader?.read?.()
    if (done) break
    chunks.push(value)
  }

  // Convert chunks to a Blob
  const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
  const audioUrl = URL.createObjectURL(audioBlob)

  // Create and play an audio element
  const audio = new Audio(audioUrl)
  if (should_play) {
    audio.play()
  }
  return audio
}

// export function waitForAudioReady(audio : HTMLAudioElement) {
//   return new Promise((resolve, reject) => {
//     // Resolve when the audio can play through
//     audio.addEventListener('canplaythrough', () => resolve(audio), {once: true})

//     // Reject if an error occurs
//     audio.addEventListener(
//       'error',
//       () => reject(new Error('Failed to load audio')),
//       {once: true}
//     )
//   })
// }
