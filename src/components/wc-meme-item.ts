import './wc-audio'

export type MemeType = {
  name: string
  audio: string
}

if (typeof window != 'undefined')
  customElements.define(
    'wc-meme-item',
    class MemeBoardItem extends HTMLElement {
      formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
          .toString()
          .padStart(2, '0')
        return `${mins}:${secs}`
      }

      async connectedCallback() {
        const {item: _item, is_display} = this.dataset
        if (!_item) return

        const item = (JSON.parse(_item || '{}') as MemeType) || {}
        let html = ''
        html += `<h4>${item.name}</h4>`
        html += `<p></p>`

        html += `
        <audio>
          <source src="${item.audio}" type="audio/mpeg">
        </audio>
        `

        html += '<div>'
        html += `<button class="play">Play</button>`
        html += `<button class="add">${is_display ? 'remove' : 'add'}</button>`
        html += '</div>'

        this.innerHTML += html

        const audio = this.querySelector('audio')
        const p = this.querySelector("p")

        audio?.addEventListener('loadedmetadata', () => {
          p.textContent = this.formatTime(audio.duration)
        })

        this.querySelector('button.play')?.addEventListener('click', e => {
          e.preventDefault()
          audio?.play?.()
        })

        this.querySelector('button.add')?.addEventListener('click', e => {
          debugger
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
