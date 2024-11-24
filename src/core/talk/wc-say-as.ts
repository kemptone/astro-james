import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, AddEvent} from './helpers'

type FormType = {
  'interpret-as': string
  format: string
  detail: string
}

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-say-as',
    class WcSayAs extends HTMLElement {
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
        const {
          'interpret-as': interpretAs,
          format,
          detail,
        } = getAttributes(this)

        parent_element.innerHTML = `
        <form>
          <label>
            <div>
              Interpret As
              <select name="interpret-as">
                <option value="characters" ${interpretAs === 'characters' ? 'selected' : ''}>Characters</option>
                <option value="spell-out" ${interpretAs === 'spell-out' ? 'selected' : ''}>Spell Out</option>
                <option value="ordinal" ${interpretAs === 'ordinal' ? 'selected' : ''}>Ordinal</option>
                <option value="cardinal" ${interpretAs === 'cardinal' ? 'selected' : ''}>Cardinal</option>
                <option value="number" ${interpretAs === 'number' ? 'selected' : ''}>Number</option>
                <option value="date" ${interpretAs === 'date' ? 'selected' : ''}>Date</option>
                <option value="time" ${interpretAs === 'time' ? 'selected' : ''}>Time</option>
                <option value="telephone" ${interpretAs === 'telephone' ? 'selected' : ''}>Telephone</option>
                <option value="address" ${interpretAs === 'address' ? 'selected' : ''}>Address</option>
              </select>
            </div>
          </label>
          <label>
            <div>
              Format (Optional)
              <input 
                type="text" 
                name="format" 
                placeholder="e.g., mdyy for dates" 
                value="${format || ''}"
              >
            </div>
          </label>
          <label>
            <div>
              Detail (Optional)
              <input 
                type="text" 
                name="detail" 
                placeholder="Additional details" 
                value="${detail || ''}"
              >
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
            if (values['interpret-as']) {
              that.setAttribute('interpret-as', values['interpret-as'])
            }
            if (values.format) {
              that.setAttribute('format', values.format)
            }
            if (values.detail) {
              that.setAttribute('detail', values.detail)
            }
          },
        })
      }
    },
  )
}
