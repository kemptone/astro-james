import { ProceduralSky } from './ProceduralSky.js'
import { getWeather } from './weatherCodes.js'

const STORAGE_KEY = 'sky-maker-weather-number'

class TemperatureGame extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.weatherCode = 1
    this.renderer = null
  }

  connectedCallback() {
    this.loadGame()
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100svh;
          min-height: 420px;
          font-family: ui-rounded, "SF Pro Rounded", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * { box-sizing: border-box; }

        .sky {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          isolation: isolate;
          background: linear-gradient(#087fce, #b8e8fb);
        }

        canvas {
          position: absolute;
          z-index: -2;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .atmosphere {
          position: absolute;
          z-index: -1;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 18%, transparent 0 32%, rgba(4, 24, 43, 0.025) 74%, rgba(2, 14, 28, 0.12) 100%),
            linear-gradient(180deg, transparent 62%, rgba(227, 244, 252, 0.07));
        }

        form {
          position: absolute;
          z-index: 2;
          left: 50%;
          bottom: max(24px, env(safe-area-inset-bottom));
          display: grid;
          grid-template-columns: 78px 46px;
          gap: 6px;
          padding: 6px;
          border: 1px solid rgba(255, 255, 255, 0.32);
          border-radius: 19px;
          background: rgba(20, 44, 68, 0.24);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 35px rgba(0, 18, 40, 0.16);
          -webkit-backdrop-filter: blur(26px) saturate(1.22);
          backdrop-filter: blur(26px) saturate(1.22);
          transform: translateX(-50%);
          opacity: 0.78;
          transition: opacity 180ms ease, background 180ms ease, border-color 180ms ease;
        }

        form:hover,
        form:focus-within {
          border-color: rgba(255, 255, 255, 0.55);
          background: rgba(20, 44, 68, 0.34);
          opacity: 1;
        }

        input,
        button {
          height: 46px;
          border: 0;
          outline: none;
          font: inherit;
        }

        input {
          width: 100%;
          min-width: 0;
          border-radius: 13px;
          padding: 0 10px;
          background: rgba(255, 255, 255, 0.12);
          color: white;
          font-size: 1.12rem;
          font-weight: 680;
          font-variant-numeric: tabular-nums;
          text-align: center;
          appearance: textfield;
          -moz-appearance: textfield;
        }

        input::-webkit-inner-spin-button,
        input::-webkit-outer-spin-button {
          margin: 0;
          -webkit-appearance: none;
        }

        input::placeholder { color: rgba(255, 255, 255, 0.68); }
        input:focus { box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.36); }

        button {
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.9);
          color: #153853;
          font-size: 1.35rem;
          font-weight: 900;
          cursor: pointer;
          transition: background 130ms ease, transform 130ms ease;
        }

        button:hover { background: white; }
        button:active { transform: scale(0.94); }
        button:focus-visible { box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.38); }

        form.is-invalid { animation: shake 280ms ease-in-out; border-color: rgba(255, 225, 225, 0.9); }

        @keyframes shake {
          25% { translate: -5px 0; }
          50% { translate: 5px 0; }
          75% { translate: -3px 0; }
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 520px) {
          form {
            bottom: max(16px, env(safe-area-inset-bottom));
            grid-template-columns: 74px 44px;
            border-radius: 18px;
          }

          input,
          button { height: 44px; }
        }

        @media (prefers-reduced-motion: reduce) {
          form { transition: none; }
          form.is-invalid { animation: none; }
        }
      </style>

      <main class="sky" id="sky" aria-label="Animated weather sky">
        <canvas id="skyCanvas" aria-hidden="true"></canvas>
        <div class="atmosphere" aria-hidden="true"></div>

        <form id="weatherForm" novalidate>
          <label class="sr-only" for="weatherNumber">Weather number from 1 to 20</label>
          <input
            id="weatherNumber"
            type="number"
            min="1"
            max="20"
            step="1"
            inputmode="numeric"
            placeholder="1–20"
            autocomplete="off"
            required
          />
          <button type="submit" aria-label="Show this weather">→</button>
        </form>

        <span class="sr-only" id="status" aria-live="polite"></span>
      </main>
    `

    const input = this.shadowRoot.getElementById('weatherNumber')
    input.value = String(this.weatherCode)
    this.renderer = new ProceduralSky(this.shadowRoot.getElementById('skyCanvas'))
    this.setupEventListeners()
    this.showWeather(this.weatherCode, true)
  }

  disconnectedCallback() {
    this.renderer?.destroy()
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('weatherForm')
    const input = this.shadowRoot.getElementById('weatherNumber')

    input.addEventListener('input', () => {
      input.setCustomValidity('')
      form.classList.remove('is-invalid')
    })

    form.addEventListener('submit', event => {
      event.preventDefault()
      const code = Number(input.value)

      if (!Number.isInteger(code) || code < 1 || code > 20) {
        input.setCustomValidity('Enter a whole number from 1 to 20.')
        form.classList.remove('is-invalid')
        void form.offsetWidth
        form.classList.add('is-invalid')
        input.reportValidity()
        input.focus()
        input.select()
        return
      }

      input.setCustomValidity('')
      this.showWeather(code)
      input.blur()
    })
  }

  showWeather(code, immediate = false) {
    const weather = getWeather(code)
    if (!weather) return

    this.weatherCode = weather.code
    this.renderer?.setWeather(weather, immediate)
    this.shadowRoot.getElementById('sky').setAttribute('aria-label', `${weather.name}, ${weather.time}, animated sky`)
    this.shadowRoot.getElementById('status').textContent = `${weather.name}, ${weather.time}`
    this.saveGame()
  }

  loadGame() {
    try {
      const savedCode = Number(localStorage.getItem(STORAGE_KEY))
      if (getWeather(savedCode)) this.weatherCode = savedCode
    } catch {
      // The sky still works if browser storage is unavailable.
    }
  }

  saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, String(this.weatherCode))
    } catch {
      // The sky still works if browser storage is unavailable.
    }
  }
}

if (typeof window !== 'undefined' && !customElements.get('weather-forecast-game')) {
  customElements.define('weather-forecast-game', TemperatureGame)
}
