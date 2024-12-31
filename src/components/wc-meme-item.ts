import './wc-audio'
import './wc-meme-image'

export type MemeType = {
  name: string
  audio: string
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-item',
    class MemeBoardItem extends HTMLElement {
      async connectedCallback() {
        const {item: _item, is_display} = this.dataset
        if (!_item) return

        const item = (JSON.parse(_item || '{}') as MemeType) || {}

        let html = `
  <h5>${item.name}</h5>
  <wc-meme-image data-name="${item.name}"></wc-meme-image>
  <div>
    <button type="button" class="play">Play</button>
    <button type="button" class="add">${is_display ? 'remove' : 'add'}</button>
  </div>
`

        // let html = ''
        // html += `<h5>${item.name}</h5>`
        // html += '<div>'
        // html += `<button type="button" class="play">Play</button>`
        // html += `<button type="button" class="add">${
        //   is_display ? 'remove' : 'add'
        // }</button>`
        // html += '</div>'

        this.innerHTML += html

        let response: Response | undefined
        let audio: HTMLAudioElement | undefined

        async function loadAudioCached(e: Event) {
          const target = e.target as HTMLButtonElement

          if (audio) return audio

          response = await fetch('/api/get_meme', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          })

          if (!response.ok) throw new Error('Failed to fetch MP3')
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          audio = new Audio(url)

          audio.addEventListener('ended', () => {
            URL.revokeObjectURL(url)
            target.innerText = 'Play'
            target.removeAttribute('data-state')
            target.addEventListener('click', onPlayInitial)
          })

          return audio
        }

        function onPlayResume(e: Event) {
          const target = e.target as HTMLButtonElement
          audio?.play?.()
          target.innerText = 'Playing'
          target.removeEventListener('click', onPlayResume)
          target.addEventListener('click', onPlayPause)
        }

        function onPlayPause(e: Event) {
          const target = e.target as HTMLButtonElement
          audio?.pause?.()
          target.innerText = 'paused'
          target.removeEventListener('click', onPlayPause)
          target.addEventListener('click', onPlayResume)
        }

        async function onPlayInitial(e: Event) {
          try {
            const target = e.target as HTMLButtonElement

            if (!target) return

            e.preventDefault()

            target.setAttribute('data-state', '1')
            target.innerText = 'Loading...'

            const audio = await loadAudioCached(e)

            target.removeEventListener('click', onPlayInitial)
            target.addEventListener('click', onPlayPause)
            target.innerText = 'Playing'

            audio?.play?.()
          } catch (error) {
            debugger
          }
        }

        this.querySelector('button.play')?.addEventListener(
          'click',
          onPlayInitial
        )

        this.querySelector('button.add')?.addEventListener('click', e => {
          if (is_display) {
            return this.parentElement?.removeChild(this)
          }

          const event = new CustomEvent('add_meme_sound', {
            detail: item,
            bubbles: true,
            composed: true,
          })
          console.count('hit add')
          this.dispatchEvent(event)
        })
      }
    }
  )
