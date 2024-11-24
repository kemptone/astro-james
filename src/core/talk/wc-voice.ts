import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, AddEvent} from './helpers'
import type {AzureVoiceInfo} from './types'

type FormType = {
  name: string
}

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-voice',
    class WcVoice extends HTMLElement {
      connectedCallback() {
        this.addEventListener('click', e => {
          e.stopImmediatePropagation()
          this.dispatchEvent(
            AddEvent({
              element: this,
            }),
          )
        })
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
            <img src="${selectedVoice?.Face}">
          </div>
          <label>
            <div>
              <select name="name">
                ${voiceOptions}
              </select>
            </div>
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
