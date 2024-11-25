import ProtoForm from '../../components/ProtoForm/ProtoForm'
import {getAttributes, AddEvent } from './helpers'

type FormType = {
  time: string
}

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-break',
    class WcBreak extends HTMLElement {

      async connectedCallback() {
        this.addEventListener('click', e => {
          e.stopImmediatePropagation()
          this.dispatchEvent(
            AddEvent({
              element: this,
            }),
          )
        })

        // if (!this.closest('#edit_area')) {
        //   this.innerHTML+= '𛲣'
        // }

      }

      renderEdit(parent_element: Element) {
        const {time, strength} = getAttributes(this)

        parent_element.innerHTML = `
        <form>
          <button>delete</button>
          <label>
            <div>
              Strength
              <select name="strength">
                <option value="none" ${strength === 'none' ? 'selected' : ''}>None</option>
                <option value="x-weak" ${strength === 'x-weak' ? 'selected' : ''}>Extra Weak</option>
                <option value="weak" ${strength === 'weak' ? 'selected' : ''}>Weak</option>
                <option value="medium" ${strength === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="strong" ${strength === 'strong' ? 'selected' : ''}>Strong</option>
                <option value="x-strong" ${strength === 'x-strong' ? 'selected' : ''}>Extra Strong</option>
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
          },
        })
      }
    },
  )
}
