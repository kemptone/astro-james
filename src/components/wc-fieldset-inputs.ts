import './wc-fieldset-inputs.css'

if (typeof window != 'undefined')
  customElements.define(
    'wc-fieldset-inputs',
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
          const label = e_input.dataset.label || e_input.value || e_input.name
          e_label.innerText = String(label).replace(/_/g, ' ')
          if (!e_input.id) {
            e_label.htmlFor = e_input.id = `${name}_${label}`
          } else {
            e_label.htmlFor = e_input.id
          }
          e_input.name = e_input.name || name || ''
          e_input.dataset.validationid = (e_input.name || name) + '_error'

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
  )
