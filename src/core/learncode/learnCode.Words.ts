import type {SubFunction} from './learnCode.types'
import ProtoForm from '../../components/ProtoForm/ProtoForm'

const main: SubFunction = ({ state, z, render, $ }) => {

  const e_button = $('button#show') as HTMLButtonElement
  const e_textarea = $('#input_words textarea') as HTMLTextAreaElement
  const e_dialog = $('#input_words') as HTMLDialogElement

  e_textarea.innerHTML = state.items
  e_button.addEventListener('click', () => e_dialog.showModal())

  ProtoForm<{
    james_code: string
  }>({
    e_form: $('#input_words form') as HTMLFormElement,
    onChange(args) {
      state.items = args.values.james_code
      render()
    },
  })

}

export default main
