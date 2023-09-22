import '../../components/wc-dialog'
import Words from './learnCode.Words'
import Alerts from './learnCode.Alerts'
import Colors from './learnCode.Colors'
import type { State } from './learnCode.types'

const state: State = {
  items: 'hello, world',
  alert_texts: '',
  actions: [],
  colors: []
}

const z: Record<string, HTMLElement | any> = {}
const d = document
const $ = d.querySelector.bind(d)
z.e_items = d.querySelector('div#items') as HTMLDivElement

function addPopup(element: HTMLButtonElement, text: string) {
  element.addEventListener('click', () => alert(text))
}

function render() {
  if (z.e_items) {
    const e_fragment = d.createDocumentFragment()
    z.e_items.innerHTML = ''
    const alert_texts_split = state.alert_texts.split(', ')
    state.items.split(', ').forEach((item, index) => {
      const e_item = d.createElement('button')
      e_item.className = 'item'
      e_item.innerText = item

      e_item.style.borderColor = state.colors[index] || 'black'
      e_item.style.color = state.colors[index] || 'black'

      if (alert_texts_split[index]) {
        addPopup(e_item, alert_texts_split[index])
      }

      e_fragment.appendChild(e_item)
    })

    z.e_items.appendChild(e_fragment)
  }
}

const obj = {
  state,
  z,
  render,
  $,
}

Words(obj)
Alerts(obj)
Colors(obj)

render()
