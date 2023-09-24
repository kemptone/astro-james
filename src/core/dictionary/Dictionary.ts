import '../../components/Dictionary/wc-dictionary-item'
import {loader} from './Dictionary.helpers'
import type {DictionaryEntry} from './Dictionary.types'

const e_list = document.querySelector('#list')
const e_form = document.querySelector('form')

const parts: DictionaryEntry[] = []

e_form?.addEventListener('proto-submit', (e: any) => {
  const word = e.detail.values.word.toUpperCase()
  const length = Number(e.detail.values.number_of_letters || '0')
  const search_settings: string[] = e.detail.values.search_settings
  const start_of_word = search_settings?.includes('start_of_word')
  const match_whole_word = search_settings?.includes('match_whole_word')

  if (word) {
    let results = match_whole_word
      ? parts.filter(part => part.word === word)
      : start_of_word
      ? parts.filter(part => part.word.indexOf(word) === 0)
      : parts.filter(part => part.word.indexOf(word) > -1)
    if (length) {
      return renderList(results.filter(part => part.word.length === length))
    } else {
      return renderList(results)
    }
  } else {
    if (length) {
      return renderList(parts.filter(part => part.word.indexOf(" ") === -1).filter(part => part.word.length === length))
    }
  }
})

function renderList(list: DictionaryEntry[]) {
  if (!e_list) return
  e_list.innerHTML = ''
  const e_fragment = document.createDocumentFragment()
  list.forEach(entry => {
    const e_element = document.createElement('wc-dictionary-item')
    const {definitions, ...others} = entry
    for (let key in others) {
      // @ts-ignore
      if (!others[key]) delete others[key]
    }
    Object.assign(e_element.dataset, {
      ...others,
      definitions: definitions?.join('\n\n'),
    })
    e_fragment.appendChild(e_element)
  })
  e_list.appendChild(e_fragment)
}

loader(parts).then(() => {
  // creates a new array that is only 100 length
  const sanity = parts.slice(0, 50)

  renderList(sanity)
})
