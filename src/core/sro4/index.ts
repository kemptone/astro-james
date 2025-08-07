class Sro3 extends HTMLElement {
  constructor() {
    super()
  }

  connectedCallback() {
    debugger
    alert("James needs to touch grass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  }

  disconnectedCallback() {
  }
}

customElements.define('sro3-app', Sro3)
