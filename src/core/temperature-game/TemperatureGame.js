const STARTING_FORECAST = [
  { highNumber: 34, lowNumber: 55 },
  { highNumber: 31, lowNumber: 52 },
  { highNumber: 29, lowNumber: 49 },
  { highNumber: 37, lowNumber: 58 },
  { highNumber: 42, lowNumber: 63 },
  { highNumber: 39, lowNumber: 60 },
  { highNumber: 27, lowNumber: 47 },
  { highNumber: 25, lowNumber: 45 },
  { highNumber: 33, lowNumber: 54 },
  { highNumber: 36, lowNumber: 57 },
]

const TEMP_COLOR_STOPS = [
  { temp: -40, color: [0, 0, 128] },
  { temp: 0, color: [0, 0, 255] },
  { temp: 40, color: [0, 255, 255] },
  { temp: 60, color: [0, 255, 0] },
  { temp: 70, color: [255, 255, 0] },
  { temp: 80, color: [255, 128, 0] },
  { temp: 100, color: [255, 0, 0] },
  { temp: 130, color: [128, 0, 0] },
  { temp: 160, color: [0, 0, 0] },
]

class TemperatureGame extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.cityName = 'Forecast City'
    this.forecast = STARTING_FORECAST.map(day => ({ ...day }))
    this.showingForecast = false
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }

        :host {
          color: #111;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .game-container {
          width: min(1180px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 24px 0 40px;
        }

        .masthead {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: end;
          border-bottom: 2px solid #111;
          padding-bottom: 18px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          font-size: clamp(2rem, 5vw, 4.5rem);
          line-height: 0.95;
          letter-spacing: 0;
        }

        .city-control {
          min-width: min(360px, 100%);
        }

        label {
          display: grid;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        input {
          width: 100%;
          min-width: 0;
          border: 2px solid #111;
          border-radius: 4px;
          background: #fff;
          color: #111;
          font: inherit;
          min-height: 42px;
          padding: 8px 10px;
        }

        button {
          border: 2px solid #111;
          border-radius: 4px;
          background: #111;
          color: #fff;
          font: inherit;
          font-weight: 800;
          min-height: 42px;
          padding: 8px 12px;
          cursor: pointer;
        }

        button.secondary {
          background: #fff;
          color: #111;
        }

        button:hover {
          outline: 2px solid #111;
          outline-offset: 2px;
        }

        .formula-strip {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          border: 2px solid #111;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 18px;
        }

        .formula {
          font-weight: 900;
          font-size: clamp(1.25rem, 3vw, 2rem);
          white-space: nowrap;
        }

        .hint {
          margin: 0;
          line-height: 1.35;
        }

        .forecast-table {
          display: grid;
          gap: 10px;
        }

        .edit-head,
        .edit-row {
          display: grid;
          grid-template-columns: minmax(90px, 0.65fr) minmax(120px, 1fr) minmax(120px, 1fr);
          gap: 10px;
          align-items: center;
        }

        .result-head,
        .result-row {
          display: grid;
          grid-template-columns: minmax(90px, 0.5fr) minmax(260px, 2fr) minmax(104px, 0.45fr) minmax(104px, 0.45fr);
          gap: 10px;
          align-items: center;
        }

        .edit-head,
        .result-head {
          font-size: 0.74rem;
          font-weight: 900;
          text-transform: uppercase;
          border-bottom: 2px solid #111;
          padding: 0 10px 8px;
        }

        .edit-row,
        .result-row {
          border: 2px solid #111;
          border-radius: 6px;
          padding: 10px;
          background: #fff;
        }

        .result-row {
          border-left: 0;
          border-right: 0;
          border-radius: 0;
        }

        .edit-row input {
          min-height: 38px;
        }

        .day-label {
          font-weight: 900;
          white-space: nowrap;
        }

        .real-temp {
          font-variant-numeric: tabular-nums;
          font-weight: 900;
          text-align: right;
          white-space: nowrap;
        }

        .result-panel {
          display: none;
        }

        .game-container.show-results .editor-panel {
          display: none;
        }

        .game-container.show-results .result-panel {
          display: block;
        }

        .forecast-title {
          margin: 0 0 14px;
          font-size: clamp(1.5rem, 3vw, 2.5rem);
          line-height: 1;
          letter-spacing: 0;
        }

        .range-cell {
          min-width: 0;
        }

        .range-track {
          position: relative;
          height: 42px;
          overflow: visible;
        }

        .range-track::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          border-top: 2px solid #c9c9c9;
          transform: translateY(-50%);
        }

        .range-bar {
          position: absolute;
          top: 50%;
          height: 12px;
          min-width: 8px;
          border: 1px solid #111;
          transform: translateY(-50%);
        }

        .scale {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 10px 0 18px;
          font-size: 0.86rem;
          font-weight: 800;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
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

        @media (max-width: 900px) {
          .masthead,
          .formula-strip {
            grid-template-columns: 1fr;
          }

          .table-head {
            display: none;
          }

          .edit-head,
          .result-head {
            display: none;
          }

          .edit-row,
          .result-row {
            grid-template-columns: 1fr 1fr;
          }

          .day-label,
          .range-cell {
            grid-column: 1 / -1;
          }

          .real-temp {
            text-align: left;
          }
        }

        @media (max-width: 520px) {
          .edit-row,
          .result-row {
            grid-template-columns: 1fr;
          }

          .actions {
            display: grid;
          }
        }
      </style>

      <div class="game-container">
        <div class="masthead">
          <div>
            <h1 id="forecastTitle">Forecast City</h1>
          </div>
          <label class="city-control">
            City name
            <input id="cityNameInput" type="text" maxlength="40" value="Forecast City" />
          </label>
        </div>

        <div class="formula-strip">
          <div class="formula">125 - _____ = real temp</div>
          <p class="hint">Type numbers for the high and low. Since the real temp is subtracted, the High # should be lower than the Low #.</p>
        </div>

        <div class="editor-panel">
          <div class="edit-head" aria-hidden="true">
            <div>Day</div>
            <div>High #</div>
            <div>Low #</div>
          </div>

          <div class="forecast-table" id="editTable"></div>
        </div>

        <div class="result-panel">
          <h2 class="forecast-title" id="resultTitle">Forecast City Forecast</h2>
          <div class="result-head" aria-hidden="true">
            <div>Day</div>
            <div>Forecast</div>
            <div>Real low</div>
            <div>Real high</div>
          </div>

          <div class="forecast-table" id="resultTable"></div>
          <div class="scale" id="scaleLabels"></div>
        </div>

        <div class="actions">
          <button class="secondary" id="resetBtn">Reset</button>
          <button class="secondary" id="editBtn" style="display: none;">Edit Numbers</button>
          <button id="randomBtn">Make Random Forecast</button>
          <button id="submitBtn">Submit Forecast</button>
        </div>
      </div>
    `

    this.render()
    this.setupEventListeners()
  }

  setupEventListeners() {
    const cityNameInput = this.shadowRoot.getElementById('cityNameInput')
    cityNameInput.addEventListener('input', event => {
      this.cityName = event.target.value.trim() || 'Forecast City'
      this.shadowRoot.getElementById('forecastTitle').textContent = this.cityName
      this.render()
    })

    this.shadowRoot.getElementById('resetBtn').addEventListener('click', () => {
      this.cityName = 'Forecast City'
      this.forecast = STARTING_FORECAST.map(day => ({ ...day }))
      this.showingForecast = false
      cityNameInput.value = this.cityName
      this.shadowRoot.getElementById('forecastTitle').textContent = this.cityName
      this.render()
    })

    this.shadowRoot.getElementById('randomBtn').addEventListener('click', () => {
      this.forecast = this.forecast.map(day => {
        const realLow = this.randomWholeNumber(18, 77)
        const realHigh = this.randomWholeNumber(realLow + 3, Math.min(realLow + 28, 105))

        return {
          ...day,
          highNumber: 125 - realHigh,
          lowNumber: 125 - realLow,
        }
      })

      this.render()
    })

    this.shadowRoot.getElementById('submitBtn').addEventListener('click', () => {
      this.normalizeForecastNumbers()
      this.showingForecast = true
      this.render()
    })

    this.shadowRoot.getElementById('editBtn').addEventListener('click', () => {
      this.showingForecast = false
      this.render()
    })
  }

  render() {
    const container = this.shadowRoot.querySelector('.game-container')
    const editTable = this.shadowRoot.getElementById('editTable')
    const resultTable = this.shadowRoot.getElementById('resultTable')
    const editBtn = this.shadowRoot.getElementById('editBtn')
    const submitBtn = this.shadowRoot.getElementById('submitBtn')
    const temperatures = this.forecast.flatMap(day => [
      this.getRealTemp(day.lowNumber),
      this.getRealTemp(day.highNumber),
    ])
    const lowestLow = Math.min(...temperatures)
    const highestHigh = Math.max(...temperatures)

    container.classList.toggle('show-results', this.showingForecast)
    editBtn.style.display = this.showingForecast ? 'inline-block' : 'none'
    submitBtn.style.display = this.showingForecast ? 'none' : 'inline-block'
    this.shadowRoot.getElementById('resultTitle').textContent = `${this.cityName} Forecast`

    editTable.innerHTML = this.forecast
      .map((day, index) => this.getEditRow(day, index))
      .join('')

    resultTable.innerHTML = this.forecast
      .map((day, index) => this.getResultRow(day, index, lowestLow, highestHigh))
      .join('')

    this.shadowRoot.getElementById('scaleLabels').innerHTML = `
      <span>Lowest low: ${lowestLow}&deg;F</span>
      <span>Highest high: ${highestHigh}&deg;F</span>
    `

    editTable.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', event => {
        this.updateForecastValue(event.target)
      })
    })
  }

  getEditRow(day, index) {
    const dayLabel = `Day ${index + 1}`

    return `
      <div class="edit-row">
        <div class="day-label">${dayLabel}</div>
        <label>
          <span class="sr-only">${dayLabel} high number</span>
          <input type="text" inputmode="decimal" data-index="${index}" data-field="highNumber" value="${day.highNumber}" aria-label="${dayLabel} high number" />
        </label>
        <label>
          <span class="sr-only">${dayLabel} low number</span>
          <input type="text" inputmode="decimal" data-index="${index}" data-field="lowNumber" value="${day.lowNumber}" aria-label="${dayLabel} low number" />
        </label>
      </div>
    `
  }

  getResultRow(day, index, lowestLow, highestHigh) {
    const dayLabel = `Day ${index + 1}`
    const realLow = this.getRealTemp(day.lowNumber)
    const realHigh = this.getRealTemp(day.highNumber)
    const lowTemp = Math.min(realLow, realHigh)
    const highTemp = Math.max(realLow, realHigh)
    const left = this.getPosition(lowTemp, lowestLow, highestHigh)
    const right = this.getPosition(highTemp, lowestLow, highestHigh)
    const width = Math.max(2, right - left)
    const rangeGradient = this.getRangeGradient(lowTemp, highTemp)

    return `
      <div class="result-row">
        <div class="day-label">${dayLabel}</div>
        <div class="range-cell" aria-label="${dayLabel} from ${lowTemp} degrees to ${highTemp} degrees">
          <div class="range-track">
            <div class="range-bar" style="left: ${left}%; width: ${width}%; background: ${rangeGradient};"></div>
          </div>
        </div>
        <div class="real-temp">${lowTemp}&deg;F</div>
        <div class="real-temp">${highTemp}&deg;F</div>
      </div>
    `
  }

  updateForecastValue(input) {
    const index = Number(input.dataset.index)
    const field = input.dataset.field

    if (!this.forecast[index] || !field) return

    const value = input.value === '' ? '' : Number(input.value)
    this.forecast[index][field] = Number.isFinite(value) || value === '' ? value : input.value
  }

  normalizeForecastNumbers() {
    this.forecast = this.forecast.map(day => {
      const highNumber = this.getForecastNumber(day.highNumber)
      const lowNumber = this.getForecastNumber(day.lowNumber)

      if (highNumber > lowNumber) {
        return {
          ...day,
          highNumber: lowNumber,
          lowNumber: highNumber,
        }
      }

      return {
        ...day,
        highNumber,
        lowNumber,
      }
    })
  }

  getRealTemp(number) {
    return 125 - this.getForecastNumber(number)
  }

  getForecastNumber(value) {
    const number = Number(value)

    return Number.isFinite(number) ? number : 0
  }

  getPosition(temp, minTemp, maxTemp) {
    if (minTemp === maxTemp) return 50

    return ((temp - minTemp) / (maxTemp - minTemp)) * 100
  }

  randomWholeNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  getTempColor(temp) {
    if (temp <= TEMP_COLOR_STOPS[0].temp) {
      return this.rgbToString(TEMP_COLOR_STOPS[0].color)
    }

    const lastStop = TEMP_COLOR_STOPS[TEMP_COLOR_STOPS.length - 1]
    if (temp >= lastStop.temp) {
      return this.rgbToString(lastStop.color)
    }

    for (let index = 0; index < TEMP_COLOR_STOPS.length - 1; index += 1) {
      const start = TEMP_COLOR_STOPS[index]
      const end = TEMP_COLOR_STOPS[index + 1]

      if (temp >= start.temp && temp <= end.temp) {
        const percent = (temp - start.temp) / (end.temp - start.temp)
        const color = start.color.map((channel, channelIndex) => {
          return Math.round(channel + (end.color[channelIndex] - channel) * percent)
        })

        return this.rgbToString(color)
      }
    }

    return this.rgbToString(lastStop.color)
  }

  getRangeGradient(lowTemp, highTemp) {
    if (lowTemp === highTemp) {
      return this.getTempColor(lowTemp)
    }

    const stops = [
      { temp: lowTemp, color: this.getTempColor(lowTemp) },
      ...TEMP_COLOR_STOPS
        .filter(stop => stop.temp > lowTemp && stop.temp < highTemp)
        .map(stop => ({ temp: stop.temp, color: this.rgbToString(stop.color) })),
      { temp: highTemp, color: this.getTempColor(highTemp) },
    ]

    const range = highTemp - lowTemp
    const colorStops = stops.map(stop => {
      const percent = ((stop.temp - lowTemp) / range) * 100

      return `${stop.color} ${percent}%`
    })

    return `linear-gradient(to right, ${colorStops.join(', ')})`
  }

  rgbToString(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  }

}

if (typeof window !== 'undefined' && !customElements.get('weather-forecast-game')) {
  customElements.define('weather-forecast-game', TemperatureGame)
}
