import {type Voice} from '@aws-sdk/client-polly'
import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {type FormType, onSubmit} from './wc-talkers.helpers'

class Talker extends HTMLElement {
  connectedCallback() {
    const that = this
    const info = JSON.parse(this.dataset.info || '{}') as Voice
    const is_preview = !!this.dataset.preview
    const shadow = this.attachShadow({mode: 'open'})
    const e_wrapper = document.createElement('form')
    const style = document.createElement('style')
    const engine = info.SupportedEngines?.[0]

    const defaultText = `Fardo the great was once a hill of a man`

    style.textContent = /*css*/ `
    .talker {
        display:flex;
        gap:10px;
        margin-top:2rem;
    }
    .talker.preview {
      margin-top:1rem;
      align-items:flex-start;
    }
    .talker .group {
      flex:1;
    }
    .talker .name {
      font-weight:600;
    }
    .talker .face {
    }
    .talker .face img {
        width:80px;
        height:80px;
    }
    .talker.preview .face img {
        width:60px;
        height:60px;
        filter:grayscale(.8) opacity(.5);
    }
    .talker .sample {
    }
    .talker .action {
        display:flex;
        gap:10px;
        align-items:center;
        justify-content: space-between;
    }
    .talker .action > .subgroup {
        display:flex;
        align-items:center;
        gap:10px;
    }
    .talker .action .plus {
      font-size:1.5rem;
      padding:0;
      border:0;
      background-color:transparent;
    }
    .talker textarea {
      display: block;
      width: 100%;
      min-height: 4rem;
      box-sizing: border-box;
    }
    `

    e_wrapper.innerHTML = `
    <div class="talker ${ is_preview ? 'preview' : '' }">
        <input type="hidden" name="text_hidden" value="${defaultText}" />
        <input type="hidden" name="voiceId" value="${info.Id}" />
        <input type="hidden" name="engine" value="${engine}" />
        <div class="face">
            <img src="${info.Face}">
        </div>
        <div class="group">
        ${
          is_preview
            ? `` : `
            <div class="sample">
                <textarea name="text">${defaultText}</textarea>
            </div>
          `
        }
        ${
          is_preview
          ? `
          <div class="action">
              <span class="name">${info.Name}</span>
              <button type="button" class="add_talker plus">⊕</button>
            </div>
          <div class="preview">
            <button>sample</button> 
          </div>
          ` : `
            <div class="action">
                <div class="subgroup">
                <span class="name">${info.Name}</span>
                <button type="button" class="remove_talker plus">⊖</button>
                </div>
                <button>play</button> 
            </div>
          `
        }
        </div>
    </div>
    `

    e_wrapper
      .querySelector('button.add_talker')
      ?.addEventListener('click', e => {
        this.dispatchEvent(
          new CustomEvent('clicked_add', {
            detail: info,
            bubbles: true,
            composed: true, // Allows the event to pass through the shadow DOM boundary
          })
        )
      })

    e_wrapper
      .querySelector('button.remove_talker')
      ?.addEventListener('click', e => {
        this.parentElement?.removeChild(this)
      })

    shadow.appendChild(e_wrapper)
    shadow.appendChild(style)

    ProtoForm<FormType>({
      e_form: e_wrapper,
      onSubmit,
    })
  }
}

if (typeof window != 'undefined') customElements.define('wc-talker', Talker)
