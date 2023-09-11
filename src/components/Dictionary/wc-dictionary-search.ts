import ProtoForm from '../ProtoForm/ProtoForm'
import '../wc-floating-label-input'

type FormType = {
  word: string
  nummber_of_letters: string
}

class WCDictionarySearch extends HTMLElement {
  connectedCallback() {

    const e_button = this.querySelector('button')

    ProtoForm<FormType>({
      e_form: this.querySelector('form'),
      onIsValid: () => {
        e_button?.removeAttribute('disabled')
      },
      onIsInvalid: () => {
        e_button?.setAttribute('disabled', 'true')
      }
    })
  }

}

if (typeof window != 'undefined')
  customElements.define('wc-dictionary-search', WCDictionarySearch)
