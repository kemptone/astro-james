if (typeof window !== 'undefined') {
  customElements.define(
    'wc-sro17',
    class extends HTMLElement {
      private shadow: ShadowRoot
      private sliders: Array<{id: number; value: number}> = []
      private nextId = 1
      private parentalCode = '••••'
      private isUnlocked = false

      constructor() {
        super()
        this.shadow = this.attachShadow({mode: 'open'})
      }

      connectedCallback() {
        this.render()
        this.attachEventListeners()
      }

      private render() {
        this.shadow.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }

          .character-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background: #f9f9f9;
          }

          .character-title {
            margin-top: 0;
            color: #333;
          }

          .mila {
            border-color: #4CAF50;
            background: #e8f5e9;
          }

          .baby-soul {
            border-color: #f44336;
            background: #ffebee;
          }

          .baby-soul.locked {
            opacity: 0.6;
            pointer-events: none;
          }

          textarea {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
          }

          button {
            padding: 10px 20px;
            margin: 5px;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
            cursor: pointer;
            font-size: 14px;
          }

          button:hover {
            background: #0056b3;
          }

          button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .unlock-section {
            margin-bottom: 20px;
          }

          input[type="password"] {
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-right: 10px;
          }

          .slider-section {
            margin-top: 40px;
            padding: 20px;
            border: 2px solid #2196F3;
            border-radius: 8px;
            background: #e3f2fd;
          }

          .sliders-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }

          .slider-controls {
            padding-right: 20px;
            border-right: 2px solid #2196F3;
          }

          .slider-display {
            padding-left: 20px;
          }

          .slider-item {
            margin-bottom: 20px;
            padding: 15px;
            background: white;
            border-radius: 4px;
            border: 1px solid #ddd;
          }

          .slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .slider-label {
            font-weight: bold;
            color: #333;
          }

          .remove-btn {
            padding: 5px 10px;
            background: #f44336;
            font-size: 12px;
          }

          .remove-btn:hover {
            background: #d32f2f;
          }

          input[type="range"] {
            width: 100%;
            margin: 10px 0;
          }

          .slider-value {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #2196F3;
          }

          .display-item {
            padding: 15px;
            margin-bottom: 10px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #2196F3;
          }

          .display-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }

          .display-value {
            font-size: 24px;
            font-weight: bold;
            color: #2196F3;
          }

          .add-slider-btn {
            background: #4CAF50;
            margin-top: 10px;
          }

          .add-slider-btn:hover {
            background: #388E3C;
          }

          @media (max-width: 768px) {
            .sliders-container {
              grid-template-columns: 1fr;
            }

            .slider-controls {
              border-right: none;
              border-bottom: 2px solid #2196F3;
              padding-right: 0;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }

            .slider-display {
              padding-left: 0;
            }
          }
        </style>

        <div class="container">
          <!-- Mila Character -->
          <div class="character-section mila">
            <h2 class="character-title">🌟 Mila (Voice: Carly)</h2>
            <p><strong>Super fun adventures!</strong> Mila is a beautiful voice that takes you on exciting journeys.</p>
            <textarea id="mila-input" placeholder="Type what you want Mila to say..."></textarea>
            <button id="mila-speak">Speak with Mila</button>
          </div>

          <!-- Baby Soul Character -->
          <div class="character-section baby-soul ${this.isUnlocked ? '' : 'locked'}" id="baby-soul-section">
            <h2 class="character-title">⚠️ Baby Soul (Voice: Annette)</h2>

            ${
              !this.isUnlocked
                ? `
              <div class="unlock-section">
                <p><strong>⚠️ Parental Control Required</strong></p>
                <p>This character uses inappropriate language. Enter parental code to unlock.</p>
                <input type="password" id="parental-code" placeholder="Enter code">
                <button id="unlock-btn">Unlock</button>
                <p id="unlock-error" style="color: red; display: none;">Incorrect code</p>
              </div>
            `
                : `
              <p><strong>⚠️ Warning:</strong> This character may use inappropriate language.</p>
              <textarea id="baby-soul-input" placeholder="Type what you want Baby Soul to say..."></textarea>
              <button id="baby-soul-speak">Speak with Baby Soul</button>
              <button id="lock-btn" style="background: #f44336;">Lock Baby Soul</button>
            `
            }
          </div>

          <!-- Slider Section -->
          <div class="slider-section">
            <h2>🎚️ Slider Fun!</h2>
            <p>Add sliders and adjust them! The values display on the right side. Sliders go from 0-100.</p>

            <div class="sliders-container">
              <div class="slider-controls">
                <h3>Controls</h3>
                <button class="add-slider-btn" id="add-slider">➕ Add Slider</button>
                <div id="sliders-list"></div>
              </div>

              <div class="slider-display">
                <h3>Display</h3>
                <div id="slider-values"></div>
              </div>
            </div>
          </div>
        </div>
      `
      }

      private attachEventListeners() {
        // Mila speak button
        const milaBtn = this.shadow.getElementById('mila-speak')
        milaBtn?.addEventListener('click', () => this.speak('mila'))

        // Unlock button
        const unlockBtn = this.shadow.getElementById('unlock-btn')
        unlockBtn?.addEventListener('click', () => this.checkParentalCode())

        // Lock button (if unlocked)
        const lockBtn = this.shadow.getElementById('lock-btn')
        lockBtn?.addEventListener('click', () => this.lockBabySoul())

        // Baby Soul speak button (if unlocked)
        const babySoulBtn = this.shadow.getElementById('baby-soul-speak')
        babySoulBtn?.addEventListener('click', () => this.speak('baby-soul'))

        // Add slider button
        const addSliderBtn = this.shadow.getElementById('add-slider')
        addSliderBtn?.addEventListener('click', () => this.addSlider())
      }

      private async speak(character: 'mila' | 'baby-soul') {
        const inputId = character === 'mila' ? 'mila-input' : 'baby-soul-input'
        const textarea = this.shadow.getElementById(
          inputId,
        ) as HTMLTextAreaElement
        const text = textarea?.value.trim()

        if (!text) {
          alert('Please enter some text first!')
          return
        }

        // Voice configurations for Microsoft Polly API
        const voiceConfig =
          character === 'mila'
            ? {
                Name: 'Microsoft Server Speech Text to Speech Voice (en-AU, CarlyNeural)',
                DisplayName: 'Carly',
                LocalName: 'Carly',
                ShortName: 'en-AU-CarlyNeural',
                Gender: 'Female',
                Locale: 'en-AU',
                LocaleName: 'English (Australia)',
                SampleRateHertz: '48000',
                VoiceType: 'Neural',
                Status: 'GA',
                WordsPerMinute: '137',
                Face: 'https://api.dicebear.com/9.x/croodles-neutral/svg?seed=en-AU-CarlyNeural',
              }
            : {
                Name: 'Microsoft Server Speech Text to Speech Voice (en-AU, AnnetteNeural)',
                DisplayName: 'Annette',
                LocalName: 'Annette',
                ShortName: 'en-AU-AnnetteNeural',
                Gender: 'Female',
                Locale: 'en-AU',
                LocaleName: 'English (Australia)',
                SampleRateHertz: '48000',
                VoiceType: 'Neural',
                Status: 'GA',
                WordsPerMinute: '154',
                Face: 'https://api.dicebear.com/9.x/croodles-neutral/svg?seed=en-AU-AnnetteNeural',
              }

        try {
          const response = await fetch('/api/polly/say_m', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...voiceConfig,
              text_hidden: '',
              text: text,
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          // Get the audio blob from the response
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)

          audio.play()

          // Clean up the URL after playback
          audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl)
          })
        } catch (error) {
          console.error('Speech synthesis error:', error)
          alert('Error speaking. Please try again.')
        }
      }

      private checkParentalCode() {
        const input = this.shadow.getElementById(
          'parental-code',
        ) as HTMLInputElement
        const error = this.shadow.getElementById('unlock-error')

        if (input.value === this.parentalCode) {
          this.isUnlocked = true
          this.render()
          this.attachEventListeners()
          this.renderSliders()
        } else {
          if (error) {
            error.style.display = 'block'
            setTimeout(() => {
              error.style.display = 'none'
            }, 3000)
          }
        }
      }

      private lockBabySoul() {
        this.isUnlocked = false
        this.render()
        this.attachEventListeners()
        this.renderSliders()
      }

      private addSlider() {
        const newSlider = {
          id: this.nextId++,
          value: 50,
        }
        this.sliders.push(newSlider)
        this.renderSliders()
      }

      private removeSlider(id: number) {
        this.sliders = this.sliders.filter(s => s.id !== id)
        this.renderSliders()
      }

      private updateSliderValue(id: number, value: number) {
        const slider = this.sliders.find(s => s.id === id)
        if (slider) {
          slider.value = value
          this.updateDisplayValues()
        }
      }

      private renderSliders() {
        const slidersList = this.shadow.getElementById('sliders-list')
        if (!slidersList) return

        slidersList.innerHTML = this.sliders
          .map(
            slider => `
        <div class="slider-item" data-id="${slider.id}">
          <div class="slider-header">
            <span class="slider-label">Slider ${slider.id}</span>
            <button class="remove-btn" data-id="${slider.id}">Remove</button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value="${slider.value}"
            data-id="${slider.id}"
          >
          <div class="slider-value">${slider.value}</div>
        </div>
      `,
          )
          .join('')

        // Attach slider event listeners
        slidersList.querySelectorAll('input[type="range"]').forEach(input => {
          input.addEventListener('input', e => {
            const target = e.target as HTMLInputElement
            const id = parseInt(target.dataset.id || '0')
            const value = parseInt(target.value)
            this.updateSliderValue(id, value)

            // Update the value display next to the slider
            const valueDiv = target.nextElementSibling
            if (valueDiv) {
              valueDiv.textContent = value.toString()
            }
          })
        })

        // Attach remove button listeners
        slidersList.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', e => {
            const target = e.target as HTMLElement
            const id = parseInt(target.dataset.id || '0')
            this.removeSlider(id)
          })
        })

        this.updateDisplayValues()
      }

      private updateDisplayValues() {
        const displayDiv = this.shadow.getElementById('slider-values')
        if (!displayDiv) return

        displayDiv.innerHTML = this.sliders
          .map(
            slider => `
        <div class="display-item">
          <div class="display-label">Slider ${slider.id}</div>
          <div class="display-value">${slider.value}</div>
        </div>
      `,
          )
          .join('')
      }
    },
  )
}
