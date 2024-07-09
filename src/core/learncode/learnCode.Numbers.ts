import type {SubFunction} from './learnCode.types'
import ProtoForm from '../../components/ProtoForm/ProtoForm'

const main: SubFunction = ({ state, z, render, $ }) => {

  const e_button = $('button#btn_numbers') as HTMLButtonElement
  const e_numbers = $('#numbers') as HTMLDivElement
  const e_textarea = $('#input_words textarea') as HTMLTextAreaElement



  e_button.addEventListener('click', () => {
    e_numbers.innerHTML = ''
    const items = state.items.split(", ")

    const e_fragment = document.createDocumentFragment()

    items.forEach( (item, index) => {
      const e_li = document.createElement("li")
      e_li.innerHTML = item
      e_fragment.appendChild(e_li)
    })
    e_numbers.appendChild(e_fragment)
  })

  // const e_dialog = $('#input_words') as HTMLDialogElement

  // e_textarea.innerHTML = state.items
  // e_button.addEventListener('click', () => e_dialog.showModal())

  // ProtoForm<{
  //   james_code: string
  // }>({
  //   e_form: $('#input_words form') as HTMLFormElement,
  //   onChange(args) {
  //     state.items = args.values.james_code
  //     render()
  //   },
  // })

}

export default main
