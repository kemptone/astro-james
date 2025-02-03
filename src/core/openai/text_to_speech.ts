import ProtoForm from '@components/ProtoForm/ProtoForm'
import {d, $, $$} from '../grok/grok.helpers'
import '../../components/wc-texarea-sizer'

type OpenAITalker = {
  text: string
  voice: string
}

async function getOpenAISpeech(props: OpenAITalker) {
  return fetch('/api/openai/openai_texttospeech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  })
}

async function playVoices(formProps: OpenAITalker[]) {
  // Get all the OpenAISpeech responses concurrently.
  const responses = await Promise.all(formProps.map(getOpenAISpeech))

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

d.addEventListener('DOMContentLoaded', async e => {
  const t_openai_talker = document.getElementById(
    'openai_talker'
  ) as HTMLTemplateElement
  const e_form = $('form#speak') as HTMLFormElement
  const e_insert_here = $('#insert_here') as HTMLDivElement
  const e_add_talker = $('#add_talker') as HTMLButtonElement

  const content = t_openai_talker.content
  const clone = document.importNode(content, true)

  e_insert_here.appendChild(clone)

  e_add_talker.addEventListener('click', () => {
    const clone = document.importNode(content, true)
    e_insert_here.appendChild(clone)
  })

  ProtoForm<{
    text: string[]
    voice: string[]
  }>({
    e_form,
    allUniqueCheckboxKeys: ['text', 'voice'],
    onSubmit: ({values}) => {
      const formProps: OpenAITalker[] = []
      // converts it to objects
      values.text.forEach((text, index) => {
        formProps.push({
          text,
          voice: values.voice[index],
        })
      })
      playVoices(formProps)
    },
  })
})
