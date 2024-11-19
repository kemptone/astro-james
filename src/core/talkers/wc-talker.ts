import {type Voice} from '@aws-sdk/client-polly'
import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {type FormType, onSubmit} from './wc-talkers.helpers'

class Talker extends HTMLElement {
  connectedCallback() {
    const info = JSON.parse(this.dataset.info || '{}') as Voice
    const shadow = this.attachShadow({mode: 'open'})
    const e_wrapper = document.createElement('form')
    const style = document.createElement('style')
    const engine = info.SupportedEngines?.[0]

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
    .talker .action {
        display:flex;
        gap:10px;
        align-items:center;
    }
    `

    e_wrapper.innerHTML = `
    <div class="talker">
        <input type="hidden" name="voiceId" value="${info.Id}" />
        <input type="hidden" name="engine" value="${engine}" />
        <div class="face">
            <img src="${info.Face}">
        </div>
        <div class="group">
            <div class="name">
            </div>
            <div class="sample">
                <textarea name="text">Fardo the great was once a hill of a man</textarea>
            </div>
            <div class="action">
                <span>
                  ${info.Name}
                </span>
                <button>Play</button> 
            </div>
        </div>
    </div>
    `

    shadow.appendChild(e_wrapper)
    shadow.appendChild(style)

    ProtoForm<FormType>({
      e_form: e_wrapper,
      onSubmit
    })
  }
}

if (typeof window != 'undefined') customElements.define('wc-talker', Talker)
