if (typeof window !== 'undefined')
  customElements.define(
    'wc-audio',
    class WCAudio extends HTMLElement {
      constructor() {
        super()

        // Attach shadow DOM
        this.attachShadow({mode: 'open'})

        // Component structure
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: inline-block;
              font-family: Arial, sans-serif;
              border: 1px solid #ddd;
              padding: 10px;
              border-radius: 5px;
              background: #f9f9f9;
              text-align: center;
            }
            button {
              margin: 5px;
              padding: 5px 10px;
              border: none;
              border-radius: 3px;
              cursor: pointer;
              background: #007bff;
              color: white;
            }
            button:hover {
              background: #0056b3;
            }
            span {
              display: block;
              margin: 5px 0;
              font-size: 14px;
            }
          </style>
          <audio></audio>
          <button id="playBtn">Play</button>
          <span id="totalTime">--:--</span>
          <button id="addBtn">Add</button>
        `
      }

      connectedCallback() {
        // Select elements
        const audio = this.shadowRoot.querySelector('audio')
        const playBtn = this.shadowRoot.querySelector('#playBtn')
        const totalTimeSpan = this.shadowRoot.querySelector('#totalTime')
        const addBtn = this.shadowRoot.querySelector('#addBtn')

        // Set audio source
        const src = this.getAttribute('src')
        if (src) {
          audio.src = src

          // Calculate total duration after metadata is loaded
          audio.addEventListener('loadedmetadata', () => {
            totalTimeSpan.textContent = this.formatTime(audio.duration)
          })
        }

        // Play/Pause functionality
        playBtn.addEventListener('click', () => {
          if (audio.paused) {
            audio.play()
            playBtn.textContent = 'Pause'
          } else {
            audio.pause()
            playBtn.textContent = 'Play'
          }
        })

        // Add button functionality
        addBtn.addEventListener('click', () => {
          const event = new CustomEvent('add', {
            detail: {src},
            bubbles: true,
            composed: true,
          })
          this.dispatchEvent(event)
        })
      }

      formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
          .toString()
          .padStart(2, '0')
        return `${mins}:${secs}`
      }
    }
  )
