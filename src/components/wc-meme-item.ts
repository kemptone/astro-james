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
        // html += `<p></p>`

        // html += `
        // <audio>
        //   <source src="${item.audio}" type="audio/mpeg">
        // </audio>
        // `

        html += '<div>'
        html += `<button type="button" class="play">Play</button>`
        html += `<button type="button" class="add">${is_display ? 'remove' : 'add'}</button>`
        html += '</div>'

        this.innerHTML += html

        this.querySelector('button.play')?.addEventListener(
          'click',
          async e => {
            // e.preventDefault()
            try {
              const response = await fetch('/api/get_meme', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body : JSON.stringify(item)
              })
              if (!response.ok) throw new Error('Failed to fetch MP3')
              const blob = await response.blob()
              const url = URL.createObjectURL(blob)
              const audio = new Audio(url)
              audio.play()
              // Clean up the blob URL after the audio ends
              audio.addEventListener('ended', () => {
                URL.revokeObjectURL(url)
              })
            } catch (error) {
              debugger
            }

          }
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
