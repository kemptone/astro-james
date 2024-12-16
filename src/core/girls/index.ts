import {girls_names} from '../../data/girls_names'
import {d, $, $$} from '../grok/grok.helpers'
import {playGrokStory, playText} from '../talkers2/wc-talkers.helpers'
import ProtoForm from '@components/ProtoForm/ProtoForm'
import {
  bad_stuff,
  ways_to_get_caught,
  behavior_cards,
  behavior_score,
  randomFromArray,
} from '@data/bad_stuff'

type FormType = {
  girls: string
  behavior: string
  gets_caught: string
  punishment_card: string
}

function outputRandomValue(name: string) {
  const newValues = {
    girl: name,
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
  const e_form = e_dialog.querySelector('form') as HTMLFormElement

  ProtoForm<FormType>({
    e_form,
    onSubmit: form => {
      debugger
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
