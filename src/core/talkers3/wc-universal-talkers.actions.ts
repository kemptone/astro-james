import {type AzureVoiceInfo} from './types'

async function postAzureSpeech(
  props: AzureVoiceInfo & {
    text?: string
    text_hidden?: string
    express_as?: string
  }
) {
  return fetch('/api/polly/say_m', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  })
}

async function playVoices(formProps: AzureVoiceInfo[]) {
  // Get all the OpenAISpeech responses concurrently.
  const responses = await Promise.all(formProps.map(postAzureSpeech))

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
