import {type Voice} from '@aws-sdk/client-polly'

class Talker extends HTMLElement {
  connectedCallback() {
    const info = JSON.parse(this.dataset.info || '{}') as Voice
    const shadow = this.attachShadow({mode: 'open'})
    const e_wrapper = document.createElement('div')
    const style = document.createElement('style')

    style.textContent = /*css*/ `
    .talker {
        display:flex;
        gap:10px;
        align-items:center;
        margin-top:2rem;
    }
    .talker .group {
    }
    .talker .name {
    }
    .talker .face {
    }
    .talker .face img {
        width:80px;
        height:80px;
    }
    .talker .sample {
    }
    `

    e_wrapper.innerHTML = `
    <div class="talker">
        <div class="face">
            <img src="${info.Face}">
        </div>
        <div class="group">
            <div class="name">
                ${info.Name}
            </div>
            <div class="sample">
                <button type="button">Play</button>
            </div>
        </div>
    </div>
    `

    shadow.appendChild(e_wrapper)
    shadow.appendChild(style)

    const e_button = e_wrapper.querySelector?.('button')

    if (e_button) {
      e_button.addEventListener('click', async e => {
        const engine = info.SupportedEngines?.[0]

        const response = await fetch('/api/polly/say', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'Fardo the great was once a hill of a man',
            voiceId: info.Id,
            engine,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch audio')
        }

        // Read the response body as a ReadableStream
        const reader = response.body?.getReader()
        const chunks = []

        // Read chunks of data from the stream
        while (true) {
          const {done, value} = await reader?.read?.()
          if (done) break
          chunks.push(value)
        }

        // Convert chunks to a Blob
        const audioBlob = new Blob(chunks, {type: 'audio/mpeg'})
        const audioUrl = URL.createObjectURL(audioBlob)

        // Create and play an audio element
        const audio = new Audio(audioUrl)
        audio.play()
      })
    }
  }
}

if (typeof window != 'undefined') customElements.define('wc-talker', Talker)
