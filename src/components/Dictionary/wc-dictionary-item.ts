// import './wc-fieldset-inputs.css'
import './wc-dictionary.css'

class WCDictionaryItem extends HTMLElement {
  connectedCallback() {
    this.render()
  }

  render() {
    const {
      word,
      prounciation,
      definitions,
      examples,
      synonyms,
      antonyms,
      related,
      etymology,
    } = this.dataset

    const split = definitions?.split(/\n\n/g)
    let html = ''
    split?.forEach((definition, index) => {
      html += `
        <div class="defn">
            ${definition}
        </div>
        `
    })

    this.innerHTML = `
    <h2 class="word">${word || ''}</h2>
    <div class="pronounciation">${prounciation || ''}</div>
    <div class="definitions">${html || ''}</div>
    <div class="examples">${examples || ''}</div>
    <div class="synonyms">${synonyms || ''}</div>
    <div class="antonyms">${antonyms || ''}</div>
    <div class="related">${related || ''}</div>
    <div class="etymology">${etymology || ''}</div>
    `
  }
}

if (typeof window != 'undefined')
  customElements.define('wc-dictionary-item', WCDictionaryItem)
