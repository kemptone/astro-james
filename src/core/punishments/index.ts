import {top1000BabyNames} from '@/data/kids_names'
import {
  handleAudioPromise,
  playTextPromise,
  TinyMarkdownFormatter,
} from '../exam/grok.helpers'
import {d, $, $$} from '../grok/grok.helpers'
import ProtoForm from '@/components/ProtoForm/ProtoForm'
import {
  bad_stuff,
  ways_to_get_caught,
  behavior_cards,
  behavior_score,
  randomFromArray,
} from '@/data/bad_stuff'

type FormType = {
  kid: string
  behavior: string
  gets_caught: string
  punishment_card: string
}

function outputRandomValue(name: string) {
  const newValues = {
    kid: name,
    behavior_score: randomFromArray(behavior_score),
    bad_thing: randomFromArray(bad_stuff),
    got_caught: randomFromArray(ways_to_get_caught),
    punishment_card: randomFromArray(behavior_cards),
  }
  return newValues
}

function buildGirls(names: string[], e_dialog: HTMLDialogElement) {
  const e_fragment = d.createDocumentFragment()

  names.forEach(name => {
    const e_button = d.createElement('button')
    e_button.innerText = name
    e_button.addEventListener('click', () => {
      const newValues = outputRandomValue(name)
      Object.entries(newValues).forEach(([key, value]) => {
        const e_input = e_dialog.querySelector(
          `input[name="${key}"]`
        ) as HTMLInputElement
        e_input.value = value
      })
      e_dialog.showModal()
    })
    e_fragment.appendChild(e_button)
  })
  return e_fragment
}

function filterResults(name: string, limit: number = 100) {
  const arr = [...top1000BabyNames]
  return arr
    .filter(item => item.indexOf(name.toLowerCase()) === 0)
    .slice(0, limit)
}

d.addEventListener('DOMContentLoaded', async e => {
  const e_girls = $('#kids') as HTMLDivElement
  const e_name_filter = $('input[name="name_filter"]') as HTMLInputElement
  const e_limit = $('input[name="limit"]') as HTMLInputElement
  const e_main = d.querySelector('#punishment_main') as HTMLDialogElement
  const e_story = d.querySelector(
    'textarea[name="text"]'
  ) as HTMLTextAreaElement
  const e_form = e_main.querySelector('form#generate_story') as HTMLFormElement
  const e_form_2 = e_main.querySelector('form#speak') as HTMLFormElement

  ProtoForm<FormType>({
    e_form,
    onSubmit: async form => {
      const {values} = form

      e_story.value = ''

      e_main.querySelectorAll('button')?.forEach?.(item => {
        item.setAttribute('disabled', 'true')
      })

      const response = await fetch('/api/grok/grok_punishment_stream', {
        method: 'POST',
        body: JSON.stringify(values),
      })

      if (!response.body) {
        console.error('Stream not supported.')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        let {done, value} = await reader.read()

        let chunk = decoder.decode(value, {stream: true})

        chunk.split('\n\n').forEach((item, index) => {
          let piece = item.replaceAll('data: ', '')

          if (piece === '[DONE]') {
            e_story.innerHTML = TinyMarkdownFormatter.format(e_story.innerHTML)
          }

          if (!piece || piece === '[DONE]') return

          try {
            const json = JSON.parse(piece)
            const content = json?.choices?.[0]?.delta?.content
            e_story.value += content || ''
          } catch (error) {
            console.error(error)
          }
        })

        if (done) {
          break
        }
      }

      e_main.querySelectorAll('button')?.forEach?.(item => {
        item.removeAttribute('disabled')
      })
    },
  })

  ProtoForm<{text: string}>({
    e_form: e_form_2,
    onSubmit: form => {
      const {text} = form.values
      const thing = playTextPromise({
        text,
        voiceId: 'Matthew',
        engine: 'neural',
      })

      handleAudioPromise(thing, () => {})
    },
  })
})
