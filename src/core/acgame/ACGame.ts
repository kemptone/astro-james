import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {persist, populate} from '../../helpers/localStorage'

type FormType = {
  name_of_inputs: string
  speak_the_values: string
  [key: string]: string
}

export type MetaVoice = {
  name: string
  localService: boolean
  voiceURI: string
  lang: {
    countryKey: string
    langKey: string
    countryName: string
    name?: string
  }
  voice: SpeechSynthesisVoice
}

// gets an input with the name jack
// and returns the value of
// the value of the

const {voice_name, read} = populate('voice') ?? {}

const e_name_of_inputs = document.querySelector(
  'input[name="name_of_inputs"]'
) as HTMLInputElement
const e_inputs = document.querySelector('#inputs') as HTMLDivElement
const e_speak_the_values = document.querySelector(
  'input[name="speak_the_values"]'
) as HTMLInputElement

ProtoForm<FormType>({
  e_form: document.querySelector('form'),
  onSubmit: ({values}) => {
    const $ = (path: string) => document.querySelector(path)
    // @ts-ignore
    const $v = (name: string) => $(`input[name="${name}"]`)?.value

    if (e_speak_the_values.checked === true) {
      const {
        name_of_inputs,
        speak_the_values,
        girls_name,
        boys_name,
        thing_to_test,
        ...others
      } = values

      let utterance = `When ${$v('boys_name')} tested the ${$v(
        'thing_to_test'
      )}, he shared the following results with ${$v('girls_name')}...`

      for (let key in others) {
        if (others[key] !== null) {
          utterance += ` ${key} was ${others[key]}, `
        }
      }

      const utterThis = new SpeechSynthesisUtterance(utterance)
      utterThis.voice = voice_name
      const synth = window.speechSynthesis
      synth.speak(utterThis)

      // alert(JSON.stringify(values))
    } else {
      alert(JSON.stringify(values))
    }
  },
  noValidate: true,
})

document.addEventListener('DOMContentLoaded', () => {
  const e_open_settings = document.querySelector(
    '#open_settings'
  ) as HTMLButtonElement
  const e_dialog = document.querySelector('#more_settings') as HTMLDialogElement

  e_open_settings.addEventListener('click', () => {
    e_dialog.showModal()
  })
})

function onChange() {
  e_inputs.innerHTML = ''

  const split_of_names = e_name_of_inputs.value.split(', ').filter(i => !!i)
  const number_of_inputs = split_of_names.length

  const e_fragment = document.createDocumentFragment()

  for (let i = 0; i < number_of_inputs; i++) {
    let e_wc_floating_label_input = document.createElement(
      'wc-floating-label-input'
    )
    e_wc_floating_label_input.dataset.label = split_of_names[i]

    let e_input = document.createElement('input')
    e_input.type = 'text'
    e_input.name = split_of_names[i]

    e_wc_floating_label_input.appendChild(e_input)
    e_fragment.appendChild(e_wc_floating_label_input)
  }

  e_inputs.appendChild(e_fragment)
}

e_name_of_inputs.addEventListener('input', onChange)

onChange()

export function loadAllVoiceList() {
  const synth = window.speechSynthesis
  const voices = synth.getVoices().sort(function (a, b) {
    const aname = a.lang
    const bname = b.lang
    if (aname < bname) {
      return -1
    } else if (aname == bname) {
      return 0
    } else {
      return +1
    }
  })
  return voices
}
