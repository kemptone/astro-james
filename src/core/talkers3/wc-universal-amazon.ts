import HTML from './templates/microsoft.html?raw'
import {getAmazonVoices, playVoices, type AITalker} from './wc-talkers.helpers'

async function postSpeech(props: AITalker) {
  return fetch('/api/polly/say', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  })
}

if (typeof window != 'undefined') {
  customElements.define(
    'wc-universal-amazon',
    class Talker extends HTMLElement {
      async connectedCallback() {
        this.innerHTML = HTML
        const e_voice_name = this.querySelector(
          "select[name='voice_name']"
        ) as HTMLSelectElement

        const e_engine = this.querySelector(
          "select[name='engine']"
        ) as HTMLSelectElement

        // this will be cached
        const {Voices = []} = await getAmazonVoices()

        e_voice_name.innerHTML = Voices.map(
          item => `<option value="${item.Id}">${item.Name}</option>`
        ).join('')

        e_voice_name.addEventListener('input', e => {
          const target = e.currentTarget as HTMLSelectElement
          const value = target.value
          const voiceObject = Voices.find(item => item.Name === value)
          if (voiceObject && voiceObject.SupportedEngines) {
            e_engine.innerHTML = voiceObject.SupportedEngines.map(
              style => `<option>${style}</option>`
            ).join('')
          } else {
            e_engine.innerHTML = ''
          }
        })

        e_voice_name.dispatchEvent(new Event('input', {}))

        this.addEventListener('talker_preview', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text

          const voice = e_voice_name.value
          const engine = e_engine.value

          playVoices([{voice, text, engine}], postSpeech)
        })

        this.addEventListener('talker_speak', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          // @ts-ignore
          const index = listener?.detail?.index
          const voice = e_voice_name.value
          const engine = e_engine.value
          playVoices([{voice, text, engine}], postSpeech)

          const event = new CustomEvent('speak_ended', {
            detail: {text, voice, engine, index},
            bubbles: true,
            composed: true,
          })
          this.dispatchEvent(event)
        })
      }
    }
  )
}
