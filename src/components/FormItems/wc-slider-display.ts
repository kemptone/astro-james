if (typeof window != 'undefined')
  customElements.define(
    'wc-slider-display',
    class extends HTMLElement {
      connectedCallback() {
        const $ = (selector: string) => this.querySelector(selector)
        const e_slider = $('input[type=range]') as HTMLInputElement
        const e_reading = $('.reading')
        if (e_reading && e_slider) {
          e_slider.addEventListener('input', (e: any) => {
            const {value} = e.target
            e_reading.innerHTML = value
          })
          e_reading.innerHTML = e_slider.value
        }
      }
    }
  )
