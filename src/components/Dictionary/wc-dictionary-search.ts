import ProtoForm from '../ProtoForm/ProtoForm'
import '../wc-floating-label-input'

type FormType = {}

class WCDictionarySearch extends HTMLElement {
  connectedCallback() {
    ProtoForm<FormType>({
      e_form: this.querySelector('form'),
      onSubmit: (formData) => {
        formData.values
        debugger
      }
    })
  }

}

if (typeof window != 'undefined')
  customElements.define('wc-dictionary-search', WCDictionarySearch)
