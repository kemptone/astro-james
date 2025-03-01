import HTML from './templates/wrap.html?raw'
import './wc-universal-native'
import './wc-universal-chatgpt'

const Options = {
  Native: {
    element: 'wc-universal-native',
  },
  ChatGPT: {
    element: 'wc-universal-chatgpt',
  },
  Microsoft: {},
  Amazon: {},
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-universal-talker',
    class Talker extends HTMLElement {
      connectedCallback() {
        this.innerHTML = HTML

        const e_voice_type = this.querySelector('select[name="voice_type"]')
        const e_preview_btn = this.querySelector('button.preview')
        const e_remove_btn = this.querySelector('button.delete')
        const e_controls = this.querySelector('.controls')
        const e_text = this.querySelector(
          'textarea[name="text"]'
        ) as HTMLTextAreaElement

        if (!e_voice_type || !e_preview_btn || !e_controls || !e_text) return

        e_remove_btn?.addEventListener?.('click', e => {
          this.parentElement?.removeChild(this)
        })

        const SpeakFunction =
          (action_type: string = 'talker_speak') =>
          () => {
            const parent = this.parentNode
            if (!parent) return
            const index = Array.from(parent.children).indexOf(this)
            const text = e_text.value
            const event = new CustomEvent(action_type, {
              detail: {text, index},
              bubbles: true,
              composed: true,
            })
            e_controls.querySelector(':nth-child(1)')?.dispatchEvent(event)
          }

        this.addEventListener('speak', SpeakFunction('talker_speak'))
        this.addEventListener('preview', SpeakFunction('talker_preview'))

        e_preview_btn.addEventListener('click', e => {
          const event = new CustomEvent('preview', {})
          this.dispatchEvent(event)
        })

        e_voice_type.innerHTML = `${Object.keys(Options)
          .map(item => `<option>${item}</option>`)
          .join('\n')}`

        e_voice_type.addEventListener('input', e => {
          const target = e.currentTarget as HTMLSelectElement
          const value = target.value
          // @ts-ignore
          const element = Options?.[value]?.element
          if (element) {
            e_controls.innerHTML = `<${element} class="sub-talker"></${element}>`
          }
        })

        this.addEventListener('wc-tts-play', e => {
          // this will listen for the even directly on the element itself, and pass it down to the sub element
        })
      }
    }
  )
