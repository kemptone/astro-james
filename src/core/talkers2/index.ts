import {playTextAzure} from './wc-talkers.helpers'
import type {AzureVoiceInfo, Talkers2VoiceDetails as VoiceDetails} from './types'
import './wc-talker-azure'

const VOICES = 'get_ms_voices'

function makeFace(name: string) {
  return `https://api.dicebear.com/9.x/croodles-neutral/svg?seed=${ name }`
}

const dog = {
  [VOICES]: (function () {
    let _t = localStorage.getItem(VOICES)
    if (_t) return JSON.parse(_t) as AzureVoiceInfo[]
    return null
  })(),
}

async function getMicrosoftVoices() {
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

document.addEventListener('DOMContentLoaded', async e => {
  const data = await getMicrosoftVoices()
  const e_list = document.querySelector('#list') as HTMLFormElement
  const e_input_area = document.querySelector('#input_area') as HTMLFormElement
  const e_fragment = document.createDocumentFragment()
  const e_clear_all = document.getElementById('clear_all')
  const e_remove_all = document.getElementById('remove_all')
  const e_play_all = document.getElementById('play_all')
  const e_hidden_button = document.getElementById('hidden_button')

  data.sort((a, b) => {
    const hasA = Array.isArray(a.StyleList) ? 1 : 0
    const hasB = Array.isArray(b.StyleList) ? 1 : 0
    return hasB - hasA
  })

  data.forEach(item => {
    const element = document.createElement('wc-talker-azure')
    element.setAttribute('data-info', JSON.stringify(item))
    element.setAttribute('data-preview', '1')
    e_fragment.appendChild(element)
  })

  e_list.append(e_fragment)

  e_play_all?.addEventListener('click', async () => {
    e_hidden_button?.click()
    const audios: HTMLAudioElement[] = []
    const all_talkers = e_input_area.querySelectorAll('wc-talker-azure')
    const fields : VoiceDetails[] = []


    all_talkers.forEach(item => {
      const thing : VoiceDetails = {}
      fields.push(thing)
      item
        .querySelectorAll('input[name], textarea[name], select[name]')
        .forEach(item => {
          // @ts-ignore
          thing[item.name] = item.value
        })
    })

    for (let x = 0; x < fields.length; x++) {
      let field = fields[x]
      let audio = await playTextAzure(
        {
          values: {
            text: field.text,
            ShortName: field.ShortName,
            Gender: field.Gender,
            Locale: field.Locale,
            express_as : field.express_as
          },
        },
        false
      )
      audios.push(audio)
    }
    playThenNext(audios)
  })

  e_remove_all?.addEventListener('click', () => {
    const all = e_input_area.querySelectorAll('wc-talker-azure')
    all.forEach(item => {
      e_input_area.removeChild(item)
    })
  })

  e_clear_all?.addEventListener('click', () => {
    const all = e_input_area.querySelectorAll('textarea')
  })

  e_list.addEventListener('clicked_add', e => {
    // @ts-ignore
    const detail = e.detail as Voice
    const element = document.createElement('wc-talker-azure')
    element.setAttribute('data-info', JSON.stringify(detail))
    e_input_area.appendChild(element)
  })

})

function playThenNext(audios: HTMLAudioElement[]) {
  const audio = audios.shift()
  if (!audio) return

  audio?.play?.()
  audio?.addEventListener('ended', () => {
    playThenNext(audios)
  })
}
