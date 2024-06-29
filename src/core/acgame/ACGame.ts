import ProtoForm from '../../components/ProtoForm/ProtoForm'

type FormType = {
  name_of_inputs: string
  speak_the_values: string
  [key: string]: string
}

// gets an input with the name jack
// and returns the value of
// the value of the

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
    if (e_speak_the_values.checked === true) {
      const {name_of_inputs, speak_the_values, ...others} = values

      let utterance =
        'When Jack tested the temperature, he came back with the following results.'

      for (let key in others) {
        utterance += ` ${key} was ${others[key]}, `
      }

      const utterThis = new SpeechSynthesisUtterance(utterance)
      const synth = window.speechSynthesis
      synth.speak(utterThis)

      // alert(JSON.stringify(values))
    } else {
      alert(JSON.stringify(values))
    }
  },
  noValidate: true,
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
    e_input.type = 'number'
    e_input.name = split_of_names[i]

    e_wc_floating_label_input.appendChild(e_input)
    e_fragment.appendChild(e_wc_floating_label_input)
  }

  e_inputs.appendChild(e_fragment)
}

e_name_of_inputs.addEventListener('input', onChange)

onChange()
