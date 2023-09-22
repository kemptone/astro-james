import type {SubFunction} from './learnCode.types'
import ProtoForm from '../../components/ProtoForm/ProtoForm'

const main: SubFunction = ({ state, z, render, $ }) => {

  const e_button = $("#btn_colors") as HTMLButtonElement
  const e_dialog = $("#colors") as HTMLDialogElement
  const e_color_list = $("#color_list") as HTMLDivElement

  e_button.addEventListener('click', () => {

    const parts = state.items.split(", ")
    const e_fragment = document.createDocumentFragment()

    parts.forEach((part) => {
      const e_item = document.createElement("input") as HTMLInputElement
      e_item.type = "color"
      e_fragment.appendChild(e_item)
    })

    e_color_list.innerHTML = ""
    e_color_list.appendChild(e_fragment)

    e_dialog.showModal()
  })

  ProtoForm<{
    colors: string
  }>({
    e_form: $('#colors form') as HTMLFormElement,
    onChange(args) {

      const colors : string[] = []

      for (const field of args.e_form.elements) {
        if (field.type === "color") {
          colors.push(field.value)
        }
      }

      state.colors = colors

      render()
    },
  })

}

export default main
