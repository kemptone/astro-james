import './wc-universal-talker'

function buildHTML() {
  const html = /*html*/ `
    <wc-universal-talker></wc-universal-talker>
  `
  return html
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-universal-talkers-list',
    class Talker extends HTMLElement {
      connectedCallback() {
        this.innerHTML = buildHTML()
      }
    }
  )
