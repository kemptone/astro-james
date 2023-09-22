import '../../components/wc-dialog'
import ProtoForm from '../../components/ProtoForm/ProtoForm'

const state : {
  items: string
  alert_texts: string
  actions: Array<() => void>
} = {
  items: 'hello, world',
  alert_texts: '',
  actions: [],
}

const d = document
const $ = d.querySelector.bind(d)
const e_button = $('button#show') as HTMLButtonElement
const e_button_alert = $('button#btn_alerts') as HTMLButtonElement
const e_dialog = $('#input_words') as HTMLDialogElement
const e_dialog_alerts = $('#alerts') as HTMLDialogElement
const e_textarea = $('#input_words textarea') as HTMLTextAreaElement
const e_items = $('div#items') as HTMLDivElement

function addPopup(element: HTMLButtonElement, text: string) {
  element.addEventListener('click', () => alert(text))
}

function renderItems() {
  if (e_items) {
    const e_fragment = d.createDocumentFragment()
    e_items.innerHTML = ''
    const alert_texts_split = state.alert_texts.split(', ') 
    state.items.split(', ').forEach((item, index) => {
      const e_item = d.createElement('button')
      e_item.className = 'item'
      e_item.innerText = item

      if (alert_texts_split[index]) {
        addPopup(e_item, alert_texts_split[index])
      }

      // if (state.actions[index]) {
      //   e_item.addEventListener('click', state.actions[index])
      // }
      e_fragment.appendChild(e_item)
    })

    e_items.appendChild(e_fragment)
  }
}

function init() {
  renderItems()
  e_textarea.innerHTML = state.items
  e_button.addEventListener('click', () => e_dialog.showModal())
  e_button_alert.addEventListener('click', () => e_dialog_alerts.showModal())
  ProtoForm<{
    james_code: string
  }>({
    e_form : $("#input_words form") as HTMLFormElement,
    onChange(args) {
      state.items = args.values.james_code
      renderItems()
    },
  })
  ProtoForm<{
    alert_texts: string
  }>({
    e_form : $("#alerts form") as HTMLFormElement,
    onChange(args) {
      state.alert_texts = args.values.alert_texts
      renderItems()
    },
  })
}

init()
