import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, stripStrings, AddEvent} from './helpers'

type FormType = {
  time: string
}

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-break',
    class WcBreak extends HTMLElement {
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
        const {time} = getAttributes(this)

        parent_element.innerHTML = `
        <form>
          <label>
            <div>
              Break Time (ms)
              <output id="break_time_output">${stripStrings(time, 0)}</output>ms
            </div>
            <input 
              type="range" 
              name="time" 
              min="0" 
              max="10000" 
              step="50" 
              value="${stripStrings(time, 0)}" 
              oninput="break_time_output.value = this.value"
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

        e_sub_main_input?.addEventListener('input', () => {
          this.innerHTML = e_sub_main_input.innerHTML
        })

        if (e_sub_main_input) {
          e_sub_main_input.innerHTML = this.innerHTML
        }

        ProtoForm<FormType>({
          e_form,
          onChange({values}) {
            values.time += 'ms'
            that.setAttribute('time', values.time)
          },
        })
      }
    },
  )
}
