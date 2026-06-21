import {girls_names} from '../../data/girls_names'
import {
  handleAudioPromise,
  playTextPromise,
  TinyMarkdownFormatter,
} from '../exam/grok.helpers'
import {d, $} from '../grok/grok.helpers'
import ProtoForm from '@/components/ProtoForm/ProtoForm'
import {
  behavior_choices,
  ways_to_get_caught,
  best_behavior_score,
  randomFromArray,
} from '@/data/bad_stuff'
import {
  buildStoryPreviewLines,
  getDefaultStoryOptionScores,
} from '@/core/girls/storyOptions'

type FormType = {
  person_name: string
  choice: string
  behavior_score: string
  what_happened: string
  opening: string
  noticeLead: string
  notice: string
  handling: string
  sounded: string
  teacher: string
  classmates: string
  ending: string
}

function getNamedField(
  e_scope: ParentNode,
  name: string
): HTMLInputElement | HTMLSelectElement | null {
  return e_scope.querySelector(
    `input[name="${name}"], select[name="${name}"]`
  ) as HTMLInputElement | HTMLSelectElement | null
}

function outputRandomValue(name: string) {
  const storyOptions = getDefaultStoryOptionScores()
  const newValues = {
    person_name: name,
    behavior_score: best_behavior_score,
    choice: randomFromArray(behavior_choices),
    what_happened: randomFromArray(ways_to_get_caught),
    ...storyOptions,
  }
  return newValues
}

function updateStoryPreview(e_dialog: HTMLDialogElement) {
  const e_person_name = e_dialog.querySelector(
    'input[name="person_name"]'
  ) as HTMLInputElement | null
  const e_choice = e_dialog.querySelector(
    'input[name="choice"]'
  ) as HTMLInputElement | null
  const e_behavior_score = e_dialog.querySelector(
    'input[name="behavior_score"]'
  ) as HTMLInputElement | null
  const e_what_happened = e_dialog.querySelector(
    'input[name="what_happened"]'
  ) as HTMLInputElement | null
  const e_lines = Array.from(
    e_dialog.querySelectorAll('[data-preview-line]')
  ) as HTMLParagraphElement[]

  if (e_lines.length === 0) {
    return
  }

  const lines = buildStoryPreviewLines({
    personName: e_person_name?.value,
    choice: e_choice?.value,
    behaviorScore: e_behavior_score?.value,
    whatHappened: e_what_happened?.value,
    opening: getNamedField(e_dialog, 'opening')?.value,
    noticeLead: getNamedField(e_dialog, 'noticeLead')?.value,
    notice: getNamedField(e_dialog, 'notice')?.value,
    handling: getNamedField(e_dialog, 'handling')?.value,
    sounded: getNamedField(e_dialog, 'sounded')?.value,
    teacher: getNamedField(e_dialog, 'teacher')?.value,
    classmates: getNamedField(e_dialog, 'classmates')?.value,
    ending: getNamedField(e_dialog, 'ending')?.value,
  })

  e_lines.forEach((line, index) => {
    line.textContent = lines[index] || ''
  })
}

function buildGirls(names: string[], e_dialog: HTMLDialogElement) {
  const e_fragment = d.createDocumentFragment()

  names.forEach(name => {
    const e_button = d.createElement('button')
    e_button.innerText = name
    e_button.addEventListener('click', () => {
      const newValues = outputRandomValue(name)
      Object.entries(newValues).forEach(([key, value]) => {
        const e_field = getNamedField(e_dialog, key)
        if (e_field) {
          e_field.value = value
        }
      })
      updateStoryPreview(e_dialog)
      e_dialog.showModal()
    })
    e_fragment.appendChild(e_button)
  })
  return e_fragment
}

function filterResults(name: string, limit: number = 100) {
  const arr = [...girls_names]
  return arr
    .filter(item => item.indexOf(name.toLowerCase()) === 0)
    .slice(0, limit)
}

d.addEventListener('DOMContentLoaded', async e => {
  const e_girls = $('#girls') as HTMLDivElement
  const e_name_filter = $('input[name="name_filter"]') as HTMLInputElement
  const e_limit = $('input[name="limit"]') as HTMLInputElement
  const e_dialog = d.querySelector('dialog#d_story') as HTMLDialogElement
  const e_story = d.querySelector(
    'textarea[name="text"]'
  ) as HTMLTextAreaElement
  const e_form = e_dialog.querySelector(
    'form#generate_story'
  ) as HTMLFormElement
  const e_form_2 = e_dialog.querySelector('form#speak') as HTMLFormElement

  ProtoForm<FormType>({
    e_form,
    onSubmit: async form => {
      const {values} = form

      e_story.value = ''

      e_dialog.querySelectorAll('button')?.forEach?.(item => {
        item.setAttribute('disabled', 'true')
      })

      const response = await fetch('/api/grok/grok_girls_stream', {
        method: 'POST',
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorText = await response.text()
        e_story.value =
          errorText ||
          'The story could not load from the server, so no story was returned.'
        e_dialog.querySelectorAll('button')?.forEach?.(item => {
          item.removeAttribute('disabled')
        })
        return
      }

      if (!response.body) {
        e_story.value = 'Stream not supported, so the story could not load.'
        e_dialog.querySelectorAll('button')?.forEach?.(item => {
          item.removeAttribute('disabled')
        })
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

      e_dialog.querySelectorAll('button')?.forEach?.(item => {
        item.removeAttribute('disabled')
      })
    },
  })

  updateStoryPreview(e_dialog)

  e_form.querySelectorAll('input, select').forEach(field => {
    field.addEventListener('input', () => {
      updateStoryPreview(e_dialog)
    })

    field.addEventListener('change', () => {
      updateStoryPreview(e_dialog)
    })
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

  function runFilter() {
    const limit = Number(e_limit?.value)
    const name_filter = e_name_filter.value
    const fragment = buildGirls(filterResults(name_filter, limit), e_dialog)
    e_girls.innerHTML = ''
    e_girls.append(fragment)
  }

  runFilter()

  e_name_filter?.addEventListener('input', e => {
    runFilter()
  })

  e_limit?.addEventListener('input', e => {
    runFilter()
  })
})
