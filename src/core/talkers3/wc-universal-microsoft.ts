import HTML from './templates/microsoft.html?raw'
import {
  getMicrosoftVoices,
  playVoices,
  type AITalker,
} from './wc-talkers.helpers'

async function postSpeech(props: AITalker) {
  return fetch('/api/polly/say_m', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  })
}

if (typeof window != 'undefined') {
  customElements.define(
    'wc-universal-microsoft',
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
        const voices = await getMicrosoftVoices()
        const sortedVoices = voices.sort((a, b) => {
          const hasA = Array.isArray(a.StyleList) ? 1 : 0
          const hasB = Array.isArray(b.StyleList) ? 1 : 0
          return hasB - hasA
        })

        e_voice_name.innerHTML = sortedVoices
          .map(
            item =>
              `<option value="${item.ShortName}">${item.LocalName}</option>`
          )
          .join('')

        e_voice_name.addEventListener('input', e => {
          const target = e.currentTarget as HTMLSelectElement
          const value = target.value
          const voiceObject = sortedVoices.find(
            item => item.ShortName === value
          )
          if (voiceObject && voiceObject.StyleList) {
            e_engine.innerHTML = voiceObject.StyleList.map(
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
