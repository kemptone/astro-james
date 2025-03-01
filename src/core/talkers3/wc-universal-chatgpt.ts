import HTML from './templates/native.html?raw'

if (typeof window != 'undefined') {
  customElements.define(
    'wc-universal-chatgpt',
    class Talker extends HTMLElement {
      connectedCallback() {
        this.innerHTML = HTML
      }
    }
  )
}
