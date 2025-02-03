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

type PromiseAndAudio = {
  promise: Promise<Response>
  audio?: HTMLAudioElement
}

async function playVoices(formProps: OpenAITalker[]) {
  const list: PromiseAndAudio[] = []
  let currentIndex = 0

  async function playNext() {
    const next = list[currentIndex]
    next?.audio?.addEventListener('ended', () => {
      if (currentIndex <= list.length) {
        playNext()
      }
    })
    next?.audio?.play?.()
    currentIndex++
  }

  formProps.forEach(talk => {
    list.push({promise: getOpenAISpeech(talk)})
  })

  Promise.all(list.map(item => item.promise)).then(async responses => {
    let x = 0

    while (x < responses.length) {
      const response = responses[x]
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      list[x].audio = audio
      x++
    }
    playNext()
  })
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
