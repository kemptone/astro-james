import './wc-meme-item'
import type {MemeType} from './wc-meme-item'
const SOUNDS = 'get_memes'

const dog = {
  [SOUNDS]: (function () {
    let _t = localStorage.getItem(SOUNDS)
    if (_t) return JSON.parse(_t) as MemeType[]
    return null
  })(),
}

export const getMemes = async () => {
  if (dog[SOUNDS]) return dog[SOUNDS]
  const results = await fetch('/api/get_memes', {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  try {
    const data = (dog[SOUNDS] = await results.json())
    localStorage.setItem(SOUNDS, JSON.stringify(data))
    return data
  } catch (error) {
    console.error(error)
  }
  return []
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-board',
    class MemeBoard extends HTMLElement {
      async connectedCallback() {
        const data = (await getMemes()) as MemeType[]

        const e_list = this.querySelector('.list') as HTMLDivElement
        const e_filter = this.querySelector(
          'input[name="filter"]'
        ) as HTMLInputElement

        function build(_data: MemeType[]) {
          e_list.innerHTML = ''
          let html = ''
          _data
            .filter(item => item.name)
            .forEach(item => {
              html += `<wc-meme-item data-item='${JSON.stringify(
                item
              )}'></wc-meme-item>`
            })
          e_list.innerHTML = html
        }

        e_filter?.addEventListener?.('input', e => {
          const target = e.target as HTMLInputElement
          const {value} = target

          if (value.length === 0) {
            build([...data])
          } else {
            const _data = [...data].filter(item => {
              return item.name.toLowerCase().indexOf(value.toLowerCase()) > -1
            })
            build(_data)
          }
        })

        build([...data])
      }
    }
  )
