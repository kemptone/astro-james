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
      onIsValid: (formData) => {
        e_button?.removeAttribute('disabled')
      },
      onIsInvalid: (formData) => {
        e_button?.setAttribute('disabled', 'true')
      }
      // onSubmit: (formData) => {
      //   formData.values
      //   debugger
      // }
    })
  }

}

if (typeof window != 'undefined')
  customElements.define('wc-dictionary-search', WCDictionarySearch)
