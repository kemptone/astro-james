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

        this.addEventListener('speak', listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          const voice = e_select.value
          speak(text, voice)
        })
      }
    }
  )
}
