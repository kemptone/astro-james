if (typeof window != 'undefined')
  customElements.define(
    'wc-dialog-wrap',
    class WCDialogWrap extends HTMLElement {
      constructor() {
        super()

        const e_dialog = this.querySelector('dialog')

        if (!e_dialog) return

        const showModal = e_dialog.showModal.bind(e_dialog)
        const show = e_dialog.show.bind(e_dialog)
        const close = e_dialog.close.bind(e_dialog)

        e_dialog.classList.add('wc-dialog')

        function fadeClose() {
          if (!e_dialog) return
          close()
          e_dialog.removeEventListener('transitionend', fadeClose)
        }

        e_dialog.showModal = () => {
          e_dialog.classList.add('in')
          showModal()
        }

        e_dialog.show = () => {
          e_dialog.classList.add('in')
          show()
        }

        e_dialog.close = () => {
          e_dialog.addEventListener('transitionend', fadeClose)
          e_dialog.classList.remove('in')
        }

        const onCancel = (ev: Event) => {
          ev.preventDefault()
          ev.stopImmediatePropagation()
          e_dialog.close()
        }

        e_dialog.addEventListener('cancel', onCancel)
        e_dialog.addEventListener('submit', onCancel)

        e_dialog.addEventListener('click', (ev: MouseEvent | TouchEvent) => {
          const touch = ev as TouchEvent
          const click = ev as MouseEvent
          const b = e_dialog.getBoundingClientRect?.()
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
            e_dialog.close()
          }
        })
      }

      connectedCallback() {
        const e_dialog = this.querySelector('dialog')
        this.querySelector('.close-dialog')?.addEventListener('click', () => {
          e_dialog?.close?.()
        })
      }
    }
  )
