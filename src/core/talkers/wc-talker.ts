import {type Voice } from '@aws-sdk/client-polly'
import ProtoForm from '../../components/ProtoForm/ProtoForm'
import { type FormType, OnSubmit } from './wc-talkers.helpers'

class Talker extends HTMLElement {
  connectedCallback() {
    const info = JSON.parse(this.dataset.info || '{}') as Voice
    const shadow = this.attachShadow({mode: 'open'})
    const e_wrapper = document.createElement('form')
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
        <input type="hidden" name="voiceId" value="${info.Id}" />
        <div class="face">
            <img src="${info.Face}">
        </div>
        <div class="group">
            <div class="name">
                ${info.Name}
            </div>
            <div class="sample">
                <button>Play</button>
            </div>
        </div>
    </div>
    `

    shadow.appendChild(e_wrapper)
    shadow.appendChild(style)

    ProtoForm<FormType>({
      e_form : e_wrapper,
      onSubmit : OnSubmit(info)
    })

  }
}

if (typeof window != 'undefined') customElements.define('wc-talker', Talker)
