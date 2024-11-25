import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, AddEvent} from './helpers'

type FormType = {
  rate: string
  pitch: string
  volume: string
}

if (typeof window !== 'undefined')
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

        if (!this.closest('#edit_area')) {
          this.innerHTML+= 'prosody'
        }

      }

      renderEdit(parent_element: Element) {
        const {rate, pitch, volume} = getAttributes(this)

        parent_element.innerHTML = `
        <form>
          <button>delete</button>
          <label>
            <div>
              Rate
              <select name="rate">
                <option value="x-slow" ${rate === 'x-slow' ? 'selected' : ''}>Extra Slow</option>
                <option value="slow" ${rate === 'slow' ? 'selected' : ''}>Slow</option>
                <option value="medium" ${rate === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="fast" ${rate === 'fast' ? 'selected' : ''}>Fast</option>
                <option value="x-fast" ${rate === 'x-fast' ? 'selected' : ''}>Extra Fast</option>
              </select>
            </div>
          </label>
          <label>
            <div>
              Pitch
              <select name="pitch">
                <option value="x-low" ${pitch === 'x-low' ? 'selected' : ''}>Extra Low</option>
                <option value="low" ${pitch === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${pitch === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${pitch === 'high' ? 'selected' : ''}>High</option>
                <option value="x-high" ${pitch === 'x-high' ? 'selected' : ''}>Extra High</option>
              </select>
            </div>
          </label>
          <label>
            <div>
              Volume
              <select name="volume">
                <option value="silent" ${volume === 'silent' ? 'selected' : ''}>Silent</option>
                <option value="x-soft" ${volume === 'x-soft' ? 'selected' : ''}>Extra Soft</option>
                <option value="soft" ${volume === 'soft' ? 'selected' : ''}>Soft</option>
                <option value="medium" ${volume === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="loud" ${volume === 'loud' ? 'selected' : ''}>Loud</option>
                <option value="x-loud" ${volume === 'x-loud' ? 'selected' : ''}>Extra Loud</option>
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

        parent_element.querySelector('button')?.addEventListener('click', () => {
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
          onChange({values, lastTouched}) {

            if (lastTouched) that.setAttribute(lastTouched, values[lastTouched])

            // if (values.rate) {
            //   that.setAttribute('rate', values.rate)
            // }
            // if (values.pitch) {
            //   that.setAttribute('pitch', values.pitch)
            // }
            // if (values.volume) {
            //   that.setAttribute('volume', values.volume)
            // }
          },
        })
      }
    },
  )
