import ProtoForm from '../../components/ProtoForm/ProtoForm'
import './wc-talker-azure'
import {VoiceId, type DescribeVoicesCommandOutput} from '@aws-sdk/client-polly'
import {playText, playTextAzure} from './wc-talkers.helpers'
import {type AzureVoiceInfo} from './types'

type VoiceDetails = {
  Name?: string
  DisplayName?: string
  LocalName?: string
  ShortName?: string
  Gender?: 'Male' | 'Female'
  Locale?: string
  LocaleName?: string
  StyleList?: string // Could be changed to a more specific type if the styles are fixed
  SampleRateHertz?: string // Alternatively, use a union of valid sample rates if limited
  VoiceType?: 'Neural' | 'Standard'
  Status?: 'GA' | 'Preview' // Expand this union if there are more statuses
  WordsPerMinute?: string | number // Depending on how it's consumed
  Face?: string // URL
  text_hidden?: string
  text?: string
  express_as?: string // Could also be a union if there are fixed expressions
}

const VOICES = 'get_ms_voices'

function makeFace(name: string) {
  return `https://api.multiavatar.com/${name}.png`
}

type FormType = {
  text: string[]
  text_hidden?: string[]
  ShortName: string[]
  Gender: string[]
  Locale: string[]
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
    item.Face = makeFace(item.Name)
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

  e_play_all?.addEventListener('click', () => {
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

    fields.forEach(async (field, index) => {
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
      if (index === 0) playThenNext(audios)
    })
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

  // ProtoForm<FormType>({
  //   e_form: e_input_area,
  //   onIsInvalid: () => {},
  //   onIsValid: () => {},
  //   onSubmit: async form => {
  //     const {values} = form
  //     const {text, ShortName, Gender, Locale } = values // arrays
  //     const audios: HTMLAudioElement[] = []

  //     for (let x = 0; x < text.length; x++) {
  //       let audio = await playTextAzure(
  //         {
  //           values: {
  //             text: text[x],
  //             ShortName: ShortName[x],
  //             Gender: Gender[x],
  //             Locale: Locale[x]
  //           },
  //         },
  //         false
  //       )
  //       audios.push(audio)
  //     }
  //     playThenNext(audios)
  //   },
  //   allUniqueCheckboxKeys: ['ShortName', 'text', 'Gender', 'Locale'],
  // })
})

function playThenNext(audios: HTMLAudioElement[]) {
  const audio = audios.shift()
  if (!audio) return

  audio?.play?.()
  audio?.addEventListener('ended', () => {
    playThenNext(audios)
  })
}
