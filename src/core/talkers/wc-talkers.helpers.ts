import {type Voice, VoiceId} from '@aws-sdk/client-polly'
import { type ReturnValues } from '../../components/ProtoForm/ProtoForm.types'

export type FormType = {
  voiceId : VoiceId
  text : string
  text_hidden : string
  engine : string
}

export const onSubmit = async (form : ReturnValues<FormType>) => {
  const response = await fetch('/api/polly/say', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: form.values.text || form.values.text_hidden,
      voiceId: form.values.voiceId,
      engine : form.values.engine,
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
  audio.play()
}