import './wc-fieldset-inputs.css'

class WCFieldsetInputs extends HTMLElement {
  connectedCallback() {
    const {legend, adderror, name, values} = this.dataset

    if (legend) {
      const e_legend = document.createElement('legend')
      e_legend.innerText = legend
      this.prepend(e_legend)
    }

    // const e_fragment = document.createDocumentFragment()
    const e_group = document.createElement('div')
    const e_inputs = this.querySelectorAll('input')

    e_inputs.forEach(e_input => {
      const e_label = document.createElement('label')
      const label = e_input.dataset.label || e_input.name
      e_label.innerText = label
      e_label.htmlFor = e_input.id = `${name}_${label}`
      e_input.name = name || ''
      e_input.dataset.validationid = name + '_error'

      e_group.appendChild(e_label)
      // removes the input from the dom, and adds it to the label
      e_label.prepend(e_input)
    })

    e_group.className = 'fieldset-inputs'
    this.appendChild(e_group)

    if (adderror) {
      const e_error = document.createElement('div')
      e_error.className = 'error'
      e_error.id = name + '_error'
      this.appendChild(e_error)
    }
  }
}

// Actually, the majority is handled in the css file
// This is just to add the label and error message
if (typeof window != 'undefined')
  customElements.define('wc-fieldset-inputs', WCFieldsetInputs)
