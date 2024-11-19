import {type Voice} from '@aws-sdk/client-polly'

class Talker extends HTMLElement {
  connectedCallback() {
    const info = JSON.parse(this.dataset.info || '{}') as Voice
    const shadow = this.attachShadow({mode: 'open'})
    const e_wrapper = document.createElement('div')
    e_wrapper.innerHTML = `
    <div class="talker">
        <div class="face">
            <img src="${info.Face}" />
        </div>
    </div>
        <div class="name">
            ${info.Name}
        </div>
        <div class="name">
            ${info.LanguageName}
        </div>
        <div class="sample">
        <button type="button">Play Sample</button>
        </div>
    </div>
    `

    shadow.appendChild(e_wrapper)

    const e_button = e_wrapper.querySelector?.('button')

    if (e_button) {
      e_button.addEventListener('click', async e => {
        debugger

        const engine = info.SupportedEngines?.[0]

        const results = await fetch('/api/polly/say', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'Fardo the great was once a hill of a man',
            voiceId: info.Id,
            engine
          }),
        })
        debugger
      })
    }
  }
}

if (typeof window != 'undefined') customElements.define('wc-talker', Talker)
