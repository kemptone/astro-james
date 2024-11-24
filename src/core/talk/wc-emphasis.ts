import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, stripStrings, AddEvent} from './helpers'

type FormType = {
  level: string
}

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-emphasis',
    class WcEmphasis extends HTMLElement {
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
        const {level = 'none'} = getAttributes(this)

        parent_element.innerHTML = `
        <form>
          <label>
            <div>
              Emphasis Level
              <select name="level">
                <option value="strong" ${level === 'strong' ? 'selected' : ''}>Strong</option>
                <option value="moderate" ${level === 'moderate' ? 'selected' : ''}>Moderate</option>
                <option value="none" ${level === 'none' ? 'selected' : ''}>None</option>
                <option value="reduced" ${level === 'reduced' ? 'selected' : ''}>Reduced</option>
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
            that.setAttribute('level', values.level)
          },
        })
      }
    },
  )
}
