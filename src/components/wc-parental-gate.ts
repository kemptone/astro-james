// Parental Gate Web Component
// Displays a modal dialog for entering parental control codes

import { validateCode } from '@/core/parental-control'

if (typeof window !== 'undefined') {
  customElements.define(
    'wc-parental-gate',
    class ParentalGate extends HTMLElement {
      private dialog: HTMLDialogElement | null = null
      private input: HTMLInputElement | null = null
      private errorMsg: HTMLElement | null = null
      private route: string = ''
      private requiredCode: string = ''

      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }

      connectedCallback() {
        this.render()
        this.attachEventListeners()
      }

      render() {
        if (!this.shadowRoot) return

        this.shadowRoot.innerHTML = `
          <link rel="stylesheet" href="/wc-parental-gate.css">
          <dialog class="parental-gate-dialog">
            <form method="dialog">
              <h2>Parent Permission Required</h2>
              <p>Please enter the 6-digit code to access this page.</p>

              <input
                type="text"
                inputmode="numeric"
                pattern="[0-9]{6}"
                maxlength="6"
                placeholder="000000"
                class="code-input"
                autocomplete="off"
              />

              <p class="error-message" style="display: none;">
                Wrong Code, don't cheat!
              </p>

              <div class="button-group">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">Submit</button>
              </div>
            </form>
          </dialog>
        `

        this.dialog = this.shadowRoot.querySelector('dialog')
        this.input = this.shadowRoot.querySelector('.code-input')
        this.errorMsg = this.shadowRoot.querySelector('.error-message')
      }

      attachEventListeners() {
        const form = this.shadowRoot?.querySelector('form')
        const cancelBtn = this.shadowRoot?.querySelector('.cancel-btn')

        form?.addEventListener('submit', e => {
          e.preventDefault()
          this.handleSubmit()
        })

        cancelBtn?.addEventListener('click', () => {
          this.handleCancel()
        })

        // Auto-focus and select all on dialog open
        this.dialog?.addEventListener('click', e => {
          if (e.target === this.dialog) {
            // Clicked on backdrop
            this.handleCancel()
          }
        })

        // Handle Escape key
        this.dialog?.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            this.handleCancel()
          }
        })
      }

      show(route: string, requiredCode: string) {
        this.route = route
        this.requiredCode = requiredCode
        this.dialog?.showModal()
        this.input?.focus()
        this.hideError()
      }

      handleSubmit() {
        const code = this.input?.value || ''
        const result = validateCode(code, this.requiredCode, this.route)

        if (result.valid) {
          this.dialog?.close()
          this.dispatchEvent(
            new CustomEvent('code-validated', {
              detail: { route: this.route },
            })
          )
        } else {
          this.showError()
          this.input?.select()
        }
      }

      handleCancel() {
        this.dialog?.close()
        this.dispatchEvent(new CustomEvent('code-cancelled'))
      }

      showError() {
        if (this.errorMsg) {
          this.errorMsg.style.display = 'block'
        }
      }

      hideError() {
        if (this.errorMsg) {
          this.errorMsg.style.display = 'none'
        }
        if (this.input) {
          this.input.value = ''
        }
      }
    }
  )
}
