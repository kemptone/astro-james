import ProtoForm from '../../components/ProtoForm/ProtoForm'

type FormType = {
  name: string
  age: string
  birth: string
  date: string
}

ProtoForm<FormType>({
  e_form: document.querySelector('form'),
  onSubmit: ({values}) => {
    alert(JSON.stringify(values))
  },
  noValidate: true,
})

const e_name_of_inputs = document.querySelector('#name_of_inputs') as HTMLInputElement
const e_number_of_inputs = document.querySelector(
  '#number_of_inputs'
) as HTMLInputElement
const e_form = document.querySelector("form") as HTMLFormElement
const e_inputs = document.querySelector('#inputs') as HTMLDivElement

e_name_of_inputs.addEventListener('input', (event) => {

  e_inputs.innerHTML = ''

  const split_of_names = e_name_of_inputs.value.split(", ").filter( i => !!i)
  const number_of_inputs = split_of_names.length

  const e_fragment = document.createDocumentFragment()

  for (let i = 0; i < number_of_inputs; i++) {
    let e_wc_floating_label_input = document.createElement('wc-floating-label-input')
    e_wc_floating_label_input.dataset.addclear = 'true'
    e_wc_floating_label_input.dataset.label = split_of_names[i]
    e_wc_floating_label_input.dataset.adderror = 'false'

    let e_input = document.createElement('input')
    e_input.type = 'number'
    e_input.name = split_of_names[i]

    e_wc_floating_label_input.appendChild(e_input)
    e_fragment.appendChild(e_wc_floating_label_input)
  }

  e_inputs.appendChild(e_fragment)

})

// e_number_of_inputs.addEventListener('input', (event) => {
//   e_inputs.innerHTML = ''

//   const e_fragment = document.createDocumentFragment()
//   const number_of_inputs = parseInt(e_number_of_inputs.value)

//   for (let i = 0; i < number_of_inputs; i++) {
//     let e_input = document.createElement('input')
//     e_input.type = 'number'
//     e_input.name = e_name_of_inputs.value + i
//     e_fragment.appendChild(e_input)
//   }

//   e_inputs.appendChild(e_fragment)

// })
