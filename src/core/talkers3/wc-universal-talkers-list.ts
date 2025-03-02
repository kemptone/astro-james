import './wc-universal-talker'
import HTML from './templates/talkers-list.html?raw'

if (typeof window != 'undefined')
  customElements.define(
    'wc-universal-talkers-list',
    class Talker extends HTMLElement {
      connectedCallback() {
        this.innerHTML = HTML

        const e_list = this.querySelector('#list') as HTMLDivElement
        const e_add = this.querySelector(
          'button.add_talker'
        ) as HTMLButtonElement
        const e_play_all = this.querySelector('#play_all') as HTMLButtonElement
        const e_remove_all = this.querySelector(
          '#remove_all'
        ) as HTMLButtonElement
        const e_add_sound = this.querySelector(
          '#add_sound'
        ) as HTMLButtonElement

        e_play_all?.addEventListener('click', e => {
          const event = new CustomEvent('speak', {})
          e_list.querySelector(':nth-child(1)')?.dispatchEvent(event)
        })

        e_remove_all?.addEventListener('click', e => {
          e_list.innerHTML = ''
        })

        e_add?.addEventListener('click', e => {
          const component = document.createElement('wc-universal-talker')
          e_list.appendChild(component)
        })

        this.addEventListener('speak_ended', listener => {
          // @ts-ignore

          console.log({listener})

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
