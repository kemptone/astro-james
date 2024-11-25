import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {
  getAttributes,
  AddEvent,
  DEFAULT_VOICE,
  getMicrosoftVoices,
} from './helpers'
import type {AzureVoiceInfo} from './types'

type FormType = {
  name: string
}

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-voice',
    class WcVoice extends HTMLElement {
      static get observedAttributes() {
        // Specify the attributes to watch
        return ['name']
      }

      async attributeChangedCallback(
        name: string,
        oldValue: string,
        newValue: string,
      ) {
        if (name === 'name' && oldValue !== newValue) {
          const voices = await getMicrosoftVoices()
          const currentVoice = voices.find(
            item => item.ShortName === newValue,
          )
          if (currentVoice)
            this.style.setProperty(
              '--background-image',
              `url(${currentVoice.Face})`,
            )
        }
      }

      async connectedCallback() {
        this.addEventListener('click', e => {
          e.stopImmediatePropagation()
          this.dispatchEvent(
            AddEvent({
              element: this,
            }),
          )
        })

        const voices = await getMicrosoftVoices()
        const currentVoice = voices.find(
          item => item.ShortName === DEFAULT_VOICE,
        )

        if (!this.closest('#edit_area')) {
          if (currentVoice) {
            this.setAttribute('name', currentVoice.ShortName)
            this.style.setProperty(
              '--background-image',
              `url(${currentVoice.Face})`,
            )
            // this.setAttribute(
            //   'style',
            //   `--background-image : url(${currentVoice.Face})`,
            // )
          }
          this.innerHTML += `Say this`
        }
      }

      renderEdit(parent_element: Element, availableVoices: AzureVoiceInfo[]) {
        const {name} = getAttributes(this)

        // Build dropdown options for voices
        const voiceOptions = availableVoices
          .map(
            voice =>
              `<option value="${voice.ShortName}" ${voice.ShortName === name ? 'selected' : ''}>
                ${voice.LocalName}
              </option>`,
          )
          .join('')

        const selectedVoice = availableVoices.find(
          item => item.ShortName === name,
        )

        parent_element.innerHTML = `
        <form>
          <div class="voice_face">
            ${selectedVoice ? `<img src="${selectedVoice?.Face}">` : ''}
          </div>
          <label>
            <div>
              <select name="name">
                ${voiceOptions}
              </select>
            </div>
            <button>delete</button>
          </label>
          <label>
            <div class="sub_main_input" contenteditable>
            </div>
          </label>
        </form>
        `

        const that = this
        const e_form = parent_element.querySelector('form')
        const e_sub_main_input = parent_element.querySelector('.sub_main_input')

        const e_delete = parent_element.querySelector('button')
        e_delete?.addEventListener('click', () => {
          this.parentElement?.removeChild(this)
          parent_element.innerHTML = ''
        })

        e_sub_main_input?.addEventListener('input', () => {
          this.innerHTML = e_sub_main_input.innerHTML
        })

        if (e_sub_main_input) {
          e_sub_main_input.innerHTML = this.innerHTML
        }

        ProtoForm<FormType>({
          e_form,
          onChange({values}) {
            if (values.name) {
              let selectedVoice = availableVoices.find(
                item => item.ShortName === values.name,
              )
              that.setAttribute('name', values.name)
              if (selectedVoice) {
                parent_element
                  .querySelector('img')
                  ?.setAttribute('src', selectedVoice?.Face)
                that
                  .querySelector('img')
                  ?.setAttribute('src', selectedVoice?.Face)
              }
            }
          },
        })
      }
    },
  )
}
