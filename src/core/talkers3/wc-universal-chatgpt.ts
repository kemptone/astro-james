import HTML from './templates/chatgpt.html?raw'
import {playVoices} from './wc-talkers.helpers'

type OpenAITalker = {
  text: string
  voice: string
}

const sortedVoices =
  'alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer'.split(', ')

async function postOpenAISpeech(props: OpenAITalker) {
  return fetch('/api/openai/openai_texttospeech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  })
}

if (typeof window != 'undefined') {
  customElements.define(
    'wc-universal-chatgpt',
    class Talker extends HTMLElement {
      connectedCallback() {
        this.innerHTML = HTML
        const e_select = this.querySelector(
          "select[name='voice_name']"
        ) as HTMLSelectElement

        e_select.innerHTML = sortedVoices
          .map(item => `<option>${item}</option>`)
          .join('')

        this.addEventListener('talker_preview', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          // @ts-ignore
          const voice = e_select.value

          await playVoices([{voice, text}], postOpenAISpeech)
        })

        this.addEventListener('talker_speak', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          // @ts-ignore
          const index = listener?.detail?.index
          const voice = e_select.value
          await playVoices([{voice, text}], postOpenAISpeech)

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
