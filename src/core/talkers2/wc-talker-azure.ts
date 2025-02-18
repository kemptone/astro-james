import {playTextAzure} from './wc-talkers.helpers'
import {type AzureVoiceInfo} from './types'
import '../../components/wc-texarea-sizer'

const BuildValue = () => {
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-talker-azure',
    class Talker extends HTMLElement {
      connectedCallback() {
        const info = JSON.parse(this.dataset.info || '{}') as AzureVoiceInfo
        const is_preview = !!this.dataset.preview
        const shadow = this
        const e_wrapper = document.createElement('div')
        const defaultText = `Fardo the great was once a hill of a man`

        e_wrapper.innerHTML = `
    <div class="talker ${is_preview ? 'preview' : ''}">

        ${Object.keys(info).map(key => `<input type="hidden" name="${key}" value="${info[key]}" />`).join(" ")}

        <input type="hidden" name="text_hidden" value="${
          is_preview ? defaultText : ''
        }" />
        <input type="hidden" name="Name" value="${info.Name}" />
        <div class="face">
            <img src="/talkers2_faces/${info.DisplayName}.webp">
        </div>
        <div class="group">
        ${
          is_preview
            ? ""
            : `
            <div class="sample">
              <wc-textarea-sizer data-min="20" data-max="500">
                <textarea name="text" rows="1"></textarea>
              </wc-textarea-sizer>
            </div>
          `
        }
        ${
          is_preview
            ? `
          <div class="action">
            <span class="name">${info.LocalName}</span>
            </div>
          <div class="preview">
            <button type="button" class="play_sample">sample</button> 
          </div>
          `
            : `
            <div class="action">
              <div class="subgroup">
              <span class="name">${info.LocalName}</span>
              </div>
              <div class="subgroup">
              ${ info.StyleList && info.StyleList.length > 1 ? `
                <select name="express_as">
                <option value="">Emotion</option>
                ${ info.StyleList.map( item => `<option>${ item }</option>`)}
                </select>
              ` : '' }
              <button type="button" class="remove_talker">remove</button>
              <button type="button" class="clear">clear</button> 
              <button type="button" class="play_sample">play</button> 
              </div>
            </div>
          `
        }
        </div>
    </div>
    `

        const e_textarea = e_wrapper.querySelector(
          'textarea',
        ) as HTMLTextAreaElement

        const addEvent = new CustomEvent('clicked_add', {
          detail: info,
          bubbles: true,
          composed: true, // Allows the event to pass through the shadow DOM boundary
        })

        if (is_preview) {
          e_wrapper.querySelector('.face img')?.addEventListener('click', e => {
            this.dispatchEvent(addEvent)
          })
          e_wrapper.querySelector('.name')?.addEventListener('click', e => {
            this.dispatchEvent(addEvent)
          })
        }

        e_wrapper
          .querySelector('button.remove_talker')
          ?.addEventListener('click', e => {
            this.parentElement?.removeChild(this)
          })

        e_wrapper
          .querySelector('button.clear')
          ?.addEventListener('click', e => {
            e_textarea.value = ''
          })

        e_wrapper
          .querySelector('button.play_sample')
          ?.addEventListener('click', e => {
            const inputs = e_wrapper.querySelectorAll('input, select, textarea')
            const values = {}
            // @ts-ignore
            inputs?.forEach?.((input: HTMLInputElement) => {
              // @ts-ignore
              values[input.name] = input.value
            })

            // @ts-ignore
            playTextAzure({values}, true)
          })

        shadow.appendChild(e_wrapper)
      }
    },
  )
