import './wc-universal-talker'
import HTML from './templates/talkers-list.html?raw'

if (typeof window != 'undefined')
  customElements.define(
    'wc-universal-talkers-list',
    class Talker extends HTMLElement {
      connectedCallback() {
        this.innerHTML = HTML

        const e_list = this.querySelector('#list') as HTMLDivElement
        const e_button = this.querySelector(
          'button.add_talker'
        ) as HTMLButtonElement
        e_button?.addEventListener('click', e => {
          const component = document.createElement('wc-universal-talker')
          e_list.appendChild(component)
        })

        this.addEventListener('speak_ended', listener => {
          // @ts-ignore
          const index = listener?.detail?.index
          const children = Array.from(e_list.children)
          const event = new CustomEvent('speak', {})
          if (children[index + 1]) {
            children[index + 1].dispatchEvent(event)
          }
        })
      }
    }
  )
