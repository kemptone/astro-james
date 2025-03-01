import {getSortedVoices, speak} from './templates/native.helpers'
import HTML from './templates/native.html?raw'

if (typeof window != 'undefined') {
  customElements.define(
    'wc-universal-native',
    class Talker extends HTMLElement {
      async connectedCallback() {
        this.innerHTML = HTML
        const e_select = this.querySelector(
          "select[name='voice_name']"
        ) as HTMLSelectElement
        const e_english_only = this.querySelector(
          "input[name='english_only']"
        ) as HTMLInputElement | null

        if (!e_english_only || !e_select) return

        const sortedVoices = await getSortedVoices(e_english_only?.checked)

        e_select.innerHTML = sortedVoices
          .map(item => `<option>${item.name}</option>`)
          .join('')

        this.addEventListener('talker_preview', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          // @ts-ignore
          const voice = e_select.value
          await speak(text, voice)
        })

        this.addEventListener('talker_speak', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          // @ts-ignore
          const index = listener?.detail?.index
          const voice = e_select.value
          await speak(text, voice)

          const event = new CustomEvent('speak_ended', {
            detail: {text, voice, index},
            bubbles: true,
            composed: true,
          })
          this.dispatchEvent(event)
        })
      }
    }
  )
}
