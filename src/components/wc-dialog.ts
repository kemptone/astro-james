import './wc-dialog.css'

// * DEAD CODE */
// https://stackoverflow.com/questions/67466609/customizable-built-in-elements-on-safari-polyfill-via-script-tag-vs-es6-import
// Safari will NEVER support extending Native Elements other than HTMLElement
// However, this will allow it to work, for now
// <script is:inline src="//unpkg.com/@ungap/custom-elements/es.js"></script>
class WCDialog extends HTMLDialogElement {
  constructor() {
    super()

    const showModal = this.showModal.bind(this)
    const show = this.show.bind(this)
    const close = this.close.bind(this)
    const that = this

    this.classList.add("wc-dialog")

    function fadeClose () {
      close()
      that.removeEventListener('transitionend', fadeClose)
    }

    this.showModal = () => {
      this.classList.add('in')
      showModal()
    }

    this.show = () => {
      this.classList.add('in')
      show()
    }

    this.close = () => {
      this.addEventListener('transitionend', fadeClose)
      this.classList.remove('in')
    }

    const onCancel = (ev : Event) => {
      ev.preventDefault()
      ev.stopImmediatePropagation()
      this.close()
    }

    this.addEventListener('cancel', onCancel)
    this.addEventListener('submit', onCancel)

    this.addEventListener(
      'click',
      (ev: MouseEvent | TouchEvent) => {
        const touch = ev as TouchEvent
        const click = ev as MouseEvent
        const b = this.getBoundingClientRect?.()
        let offsetX = 0
        let offsetY = 0

        if (ev.type === 'touchstart') {
          offsetX = touch.touches[0].clientX - b.left
          offsetY = touch.touches[0].clientY - b.top
        } else {
          offsetX = click.clientX - b.left
          offsetY = click.clientY - b.top
        }

        if (
          offsetX < 0 ||
          offsetX > b.width ||
          offsetY < 0 ||
          offsetY > b.height
        ) {
          this.close()
        }
      }
    )
  }

}

if (typeof window != 'undefined')
  customElements.define('wc-dialog', WCDialog, {
    extends: 'dialog',
  })
