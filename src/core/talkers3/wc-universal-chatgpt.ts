import HTML from './templates/chatgpt.html?raw'

type OpenAITalker = {
  text: string
  voice: string
}

const sortedVoices =
  'alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer'.split(', ')

async function getOpenAISpeech(props: OpenAITalker) {
  return fetch('/api/openai/openai_texttospeech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props),
  })
}

async function playVoices(formProps: OpenAITalker[]) {
  // Get all the OpenAISpeech responses concurrently.
  const responses = await Promise.all(formProps.map(getOpenAISpeech))

  // Convert responses into audio elements concurrently.
  const audios = await Promise.all(
    responses.map(async response => {
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      return new Audio(audioUrl)
    })
  )

  // Helper: Returns a promise that resolves when the audio ends.
  const playAudio = (audio: HTMLAudioElement) =>
    new Promise<void>(resolve => {
      audio.addEventListener('ended', resolve, {once: true})
      audio.play()
    })

  // Play all audios sequentially.
  for (const audio of audios) {
    await playAudio(audio)
  }
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

          await playVoices([{voice, text}])
        })

        this.addEventListener('talker_speak', async listener => {
          // @ts-ignore
          const text = listener?.detail?.text
          // @ts-ignore
          const index = listener?.detail?.index
          const voice = e_select.value
          await playVoices([{voice, text}])

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
