import {VoiceId} from '@aws-sdk/client-polly'

export class TinyMarkdownFormatter {
  static format(input: string): string {
    return (
      input
        // Bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
        // Italics: *text* or _text_
        .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
        // Headings: # Heading
        .replace(/^#{6}\s(.*$)/gm, '<h6>$1</h6>')
        .replace(/^#{5}\s(.*$)/gm, '<h5>$1</h5>')
        .replace(/^#{4}\s(.*$)/gm, '<h4>$1</h4>')
        .replace(/^#{3}\s(.*$)/gm, '<h3>$1</h3>')
        .replace(/^#{2}\s(.*$)/gm, '<h2>$1</h2>')
        .replace(/^#\s(.*$)/gm, '<h1>$1</h1>')
        // Links: [text](url)
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        // Line breaks: Two spaces at end of line
        .replace(/  \n/g, '<br/>')
    )
  }
}

export type ChatCompletion = {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
      refusal: string | null
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details: {
      text_tokens: number
      audio_tokens: number
      image_tokens: number
      cached_tokens: number
    }
  }
  system_fingerprint: string
}

export const d = document
export const $ = (selectors: string) => d.querySelector(selectors)
export const $$ = (selectors: string) => d.querySelectorAll(selectors)

type FormType = {
  voiceId: VoiceId
  text: string
  text_hidden?: string
  engine: string
}

// this will return a promise
export const playTextPromise = (values: FormType) => {
  return fetch('/api/polly/say', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })
}

export const playAll = async (audios: Promise<Response>[]) => {
  const first = audios.shift()
  if (first) {
    await handleAudioPromise(first, () => {
      playAll(audios)
    })
  }
}

export const handleAudioPromise = async (
  promise: Promise<Response>,
  onEnded: () => void
) => {
  const response = await promise

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
  audio.addEventListener('ended', onEnded)
  return audio.play()
}
