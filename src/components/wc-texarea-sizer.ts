import './wc-fieldset-inputs.css'

if (typeof window != 'undefined')
  customElements.define(
    'wc-textarea-sizer',
    class WCTextAreaSizer extends HTMLElement {
      connectedCallback() {
        const e_textarea = this.querySelector('textarea')

        if (!e_textarea) return
        const min = e_textarea.scrollHeight
        e_textarea.addEventListener('input', e => {
          e_textarea.style.height = 'auto'
          const scrollHeight = e_textarea.scrollHeight
          const newHeight = Math.min(Math.max(scrollHeight, min), 2000)

          console.log({
            scrollHeight,
            newHeight,
            min
          })

          e_textarea.style.height = `${newHeight}px`
        })
      }
    }
  )
