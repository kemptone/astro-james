import "./wc-meme-item"
import type { MemeType } from "./wc-meme-item"
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
        headers : {
           'Content-Type': 'application/json',
        }
    })
    try {
      const data = dog[SOUNDS] = await results.json()
      const attempt = JSON.stringify(data)
      const unattempt = JSON.parse(attempt)
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
        const data = await getMemes() as MemeType[]
        let html = ''
        data.forEach( item => {
            html += `<wc-meme-item data-item='${ JSON.stringify(item) }'></wc-meme-item>`
        })
        this.innerHTML = html
      }
    }
  )
