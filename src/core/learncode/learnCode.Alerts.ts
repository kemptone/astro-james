import type {SubFunction} from './learnCode.types'
import ProtoForm from '../../components/ProtoForm/ProtoForm'

const main: SubFunction = ({ state, z, render, $ }) => {

  const e_button_alert = $('button#btn_alerts') as HTMLButtonElement
  const e_dialog_alerts = $('#alerts') as HTMLDialogElement

  e_button_alert.addEventListener('click', () =>
    e_dialog_alerts.showModal()
  )

  ProtoForm<{
    alert_texts: string
  }>({
    e_form: $('#alerts form') as HTMLFormElement,
    onChange(args) {
      state.alert_texts = args.values.alert_texts
      render()
    },
  })

}

export default main
