import './wc-meme-item'
import type {MemeType} from './wc-meme-item'
const SOUNDS_CACHE_KEY = 'get_memes_with_bad_word_ranks_v2'
const SOUNDS_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

type SoundsCache = {
  savedAt: number
  items: MemeType[]
}

function readSoundsCache() {
  if (typeof localStorage === 'undefined') return null

  try {
    const raw = localStorage.getItem(SOUNDS_CACHE_KEY)
    if (!raw) return null

    const cached = JSON.parse(raw) as SoundsCache
    const isCurrent = Date.now() - cached.savedAt < SOUNDS_CACHE_MAX_AGE

    if (isCurrent && Array.isArray(cached.items)) return cached.items

    localStorage.removeItem(SOUNDS_CACHE_KEY)
  } catch (error) {
    console.warn('Could not read the cached sounds', error)
  }

  return null
}

let cachedMemes = readSoundsCache()

function writeSoundsCache(items: MemeType[]) {
  if (typeof localStorage === 'undefined') return

  try {
    const cached: SoundsCache = {savedAt: Date.now(), items}
    localStorage.setItem(SOUNDS_CACHE_KEY, JSON.stringify(cached))
  } catch (error) {
    console.warn('Could not cache the sounds', error)
  }
}

export const getMemes = async () => {
  if (cachedMemes) return cachedMemes
  const results = await fetch('/api/get_memes', {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  try {
    const data = (await results.json()) as MemeType[]
    cachedMemes = data
    writeSoundsCache(data)
    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-board',
    class MemeBoard extends HTMLElement {
      async connectedCallback() {
        const data = ((await getMemes()) || []).filter(item => item.name)

        const e_list = this.querySelector('.list') as HTMLDivElement
        const e_filter = this.querySelector(
          'input[name="filter"]'
        ) as HTMLInputElement
        const e_count = this.querySelector(
          '[data-sound-count]'
        ) as HTMLOutputElement

        function updateCount(count: number) {
          if (e_count) {
            e_count.textContent = `${count.toLocaleString()} ${
              count === 1 ? 'sound' : 'sounds'
            }`
          }
        }

        function build() {
          let html = ''
          data.forEach(item => {
            html += `<wc-meme-item data-item='${JSON.stringify(
              item
            )}'></wc-meme-item>`
          })
          e_list.innerHTML = html
          updateCount(data.length)
        }

        e_filter?.addEventListener?.('input', e => {
          const target = e.target as HTMLInputElement
          const value = target.value.toLowerCase()
          const items = e_list.querySelectorAll('wc-meme-item')
          let visibleCount = 0

          items.forEach((item, index) => {
            const isVisible = data[index].name.toLowerCase().includes(value)
            item.toggleAttribute('hidden', !isVisible)
            if (isVisible) visibleCount++
          })

          updateCount(visibleCount)
        })

        build()
      }
    }
  )
