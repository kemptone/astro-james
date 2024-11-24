import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, stripStrings} from './helpers'

type FormType = {
  rate: string
  pitch: string
  volume: string
}

const AddEvent = (detail = {}, key = 'clicked_edit') =>
  new CustomEvent(key, {
    detail,
    bubbles: true,
    composed: true, // Allows the event to pass through the shadow DOM boundary
  })

if (typeof window != 'undefined')
  customElements.define(
    'wc-prosody',
    class WcProsody extends HTMLElement {
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

      renderEdit(parent_element: Element) {
        const {rate, pitch, volume} = getAttributes(this)

        parent_element.innerHTML = `
        <form>
          <label>
            <div>
              Rate
              <output id="prosody_rate_output">${stripStrings(rate, 100)}</output>%
            </div>
            <input 
              type="range" 
              name="rate" 
              min="-100" 
              max="400" 
              step=".1" 
              value="${stripStrings(rate, 100)}" 
              oninput="prosody_rate_output.value = this.value"
            >
          </label>
          <label>
            <div>
              Pitch
              <output id="prosody_range_output">${stripStrings(pitch, 0)}</output>st
            </div>
            <input 
              type="range" 
              name="pitch" 
              min="-24" 
              max="24" 
              step=".1" 
              value="${stripStrings(pitch, 0)}" 
              oninput="prosody_range_output.value = this.value"
            >
          </label>
          <label>
            <div>
              Volume
              <output id="prosody_volume_output">${stripStrings(volume, 0)}</output>db
            </div>
            <input 
              type="range" 
              name="volume" 
              min="-96" 
              max="96" 
              step=".1" 
              value="${stripStrings(volume, 0)}" 
              oninput="prosody_volume_output.value = this.value"
            >
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

        e_sub_main_input?.addEventListener('input', e => {
          this.innerHTML = e_sub_main_input.innerHTML
        })

        if (e_sub_main_input) {
          e_sub_main_input.innerHTML = this.innerHTML
        }

        ProtoForm<FormType>({
          e_form,
          onChange({values}) {
            values.pitch += 'st'
            values.rate += '%'
            values.volume += 'db'
            for (const [key, value] of Object.entries(values)) {
              that.setAttribute(key, value)
            }
          },
        })
      }
    },
  )
