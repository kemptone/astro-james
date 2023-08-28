import './wc-floating-label.css'

class WCFloatingLabel extends HTMLElement {
  connectedCallback() {
    const {addclear, label, adderror} = this.dataset
    const e_input = this.querySelector('input, select, textarea') as HTMLInputElement | null

    if (!e_input) return

    if (addclear) {
      const e_clear = document.createElement('span')
      e_clear.className = 'clear'
      e_clear.innerText = '✕'
      e_clear.addEventListener('click', () => {
        e_input.value = ''
        e_input.focus()
        e_input.blur()
        e_input.focus()
      })
      this.appendChild(e_clear)
    }

    if (label) {
      const e_label = document.createElement('label')
      e_label.innerText = label
      if (e_input.id) {
        e_label.htmlFor = e_input.id
      } else {
        e_input.id = e_label.htmlFor = `${e_input.name}_id`
      }
      this.prepend(e_label)
    }

    if (adderror) {
      if (!e_input.dataset.validationid) {
        const e_error = document.createElement('div')
        e_error.className = 'error'
        e_input.dataset.validationid = e_error.id = e_input.name + '_error'
        this.appendChild(e_error)
      }
    }
  }
}

// Actually, the majority is handled in the css file
// This is just to add the label and error message
if (typeof window != 'undefined')
  customElements.define('wc-floating-label-input', WCFloatingLabel)
