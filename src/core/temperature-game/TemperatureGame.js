// Fantasy cities with their secret numbers
const fantasyCity = [
  { name: 'Dragonspire', secretNumber: 37 },
  { name: 'Frostholm', secretNumber: 95 },
  { name: 'Sunhaven', secretNumber: 15 },
  { name: 'Shadowmere', secretNumber: 52 },
  { name: 'Crystalpeak', secretNumber: 78 },
  { name: 'Emberfall', secretNumber: 23 },
  { name: 'Moonvale', secretNumber: 61 },
  { name: 'Stormkeep', secretNumber: 44 },
]

class TemperatureGame extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.mode = 'single' // 'single' or 'multiple'
    this.currentCity = null
    this.cityList = [] // For multiple mode: {cityName, userNumber}
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }
        .game-container {
          padding: 20px;
          max-width: 700px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, sans-serif;
        }
        h1 {
          text-align: center;
          color: #333;
        }
        .mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          justify-content: center;
        }
        .mode-btn {
          padding: 12px 24px;
          font-size: 1em;
          border: 2px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .mode-btn.active {
          background: #667eea;
          color: white;
        }
        .mode-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        .city-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .city-name {
          font-size: 2em;
          font-weight: bold;
          margin: 0;
        }
        .input-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        input[type="number"], input[type="text"] {
          width: 100%;
          padding: 12px;
          font-size: 1.2em;
          border: 2px solid #ddd;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        button {
          width: 100%;
          padding: 12px;
          font-size: 1.1em;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover {
          background: #5568d3;
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .result {
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 1.3em;
          font-weight: bold;
        }
        .result.correct {
          background: #d4edda;
          color: #155724;
          border: 2px solid #c3e6cb;
        }
        .result.incorrect {
          background: #f8d7da;
          color: #721c24;
          border: 2px solid #f5c6cb;
        }
        .formula {
          background: #fff3cd;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin-top: 10px;
          font-size: 0.9em;
          color: #856404;
        }
        .city-list {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          max-height: 300px;
          overflow-y: auto;
        }
        .city-item {
          background: white;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          width: auto;
        }
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 1.5em;
          color: #667eea;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .multiple-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .add-btn {
          background: #28a745;
          margin-bottom: 10px;
        }
        .results-list {
          margin-top: 20px;
        }
      </style>
      <div class="game-container">
        <h1>Fantasy City Temperature Game</h1>

        <div class="mode-selector">
          <button class="mode-btn active" id="singleModeBtn">Single City</button>
          <button class="mode-btn" id="multipleModeBtn">Multiple Cities</button>
        </div>

        <!-- Single City Mode -->
        <div id="singleMode">
          <div class="city-card">
            <h2 class="city-name" id="cityName">Loading...</h2>
          </div>

          <div class="input-section">
            <label for="numberInput">Enter the city's secret number:</label>
            <input type="number" id="numberInput" placeholder="Enter any number">
            <button id="submitBtn">Calculate Temperature</button>
            <div class="formula">Formula: Temperature = 125 - Your Number (negative numbers add!)</div>
          </div>

          <div id="singleResult" style="display: none;"></div>
          <button id="nextBtn" style="display: none;">Next City</button>
        </div>

        <!-- Multiple Cities Mode -->
        <div id="multipleMode" style="display: none;">
          <div class="input-section">
            <label>Create Your Cities:</label>
            <div class="multiple-inputs">
              <input type="text" id="cityNameInput" placeholder="City name">
              <input type="number" id="cityNumberInput" placeholder="Secret number (any number)">
            </div>
            <button class="add-btn" id="addCityBtn">Add City</button>
            <div class="formula">Formula: Temperature = 125 - Secret Number (negative numbers add!)</div>
          </div>

          <div class="city-list" id="cityList" style="display: none;">
            <h3>Your Cities:</h3>
            <div id="citiesContainer"></div>
          </div>

          <button id="submitAllBtn" style="display: none;">Submit All Cities</button>
        </div>

        <!-- Multiple Cities Results (outside multipleMode so it can be shown separately) -->
        <div id="multipleResults" style="display: none;"></div>

        <div id="loadingScreen" style="display: none;">
          <div class="loading">
            <div class="spinner"></div>
            <div>Calculating temperatures...</div>
          </div>
        </div>
      </div>
    `

    this.setupEventListeners()
    this.loadNewCity()
  }

  setupEventListeners() {
    // Mode switching
    const singleModeBtn = this.shadowRoot.getElementById('singleModeBtn')
    const multipleModeBtn = this.shadowRoot.getElementById('multipleModeBtn')

    singleModeBtn.addEventListener('click', () => {
      this.switchMode('single')
    })

    multipleModeBtn.addEventListener('click', () => {
      this.switchMode('multiple')
    })

    // Single mode events
    const submitBtn = this.shadowRoot.getElementById('submitBtn')
    submitBtn.addEventListener('click', () => this.handleSingleSubmit())

    const nextBtn = this.shadowRoot.getElementById('nextBtn')
    nextBtn.addEventListener('click', () => this.loadNewCity())

    const numberInput = this.shadowRoot.getElementById('numberInput')
    numberInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSingleSubmit()
      }
    })

    // Multiple mode events
    const addCityBtn = this.shadowRoot.getElementById('addCityBtn')
    addCityBtn.addEventListener('click', () => this.addCity())

    const submitAllBtn = this.shadowRoot.getElementById('submitAllBtn')
    submitAllBtn.addEventListener('click', () => this.handleMultipleSubmit())

    const cityNameInput = this.shadowRoot.getElementById('cityNameInput')
    const cityNumberInput = this.shadowRoot.getElementById('cityNumberInput')

    cityNumberInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCity()
      }
    })
  }

  switchMode(mode) {
    this.mode = mode
    const singleModeBtn = this.shadowRoot.getElementById('singleModeBtn')
    const multipleModeBtn = this.shadowRoot.getElementById('multipleModeBtn')
    const singleMode = this.shadowRoot.getElementById('singleMode')
    const multipleMode = this.shadowRoot.getElementById('multipleMode')

    if (mode === 'single') {
      singleModeBtn.classList.add('active')
      multipleModeBtn.classList.remove('active')
      singleMode.style.display = 'block'
      multipleMode.style.display = 'none'
      this.loadNewCity()
    } else {
      singleModeBtn.classList.remove('active')
      multipleModeBtn.classList.add('active')
      singleMode.style.display = 'none'
      multipleMode.style.display = 'block'
      this.cityList = []
      this.updateCityList()
    }
  }

  loadNewCity() {
    // Pick a random city
    this.currentCity = fantasyCity[Math.floor(Math.random() * fantasyCity.length)]

    this.shadowRoot.getElementById('cityName').textContent = this.currentCity.name
    this.shadowRoot.getElementById('numberInput').value = ''
    this.shadowRoot.getElementById('numberInput').disabled = false
    this.shadowRoot.getElementById('submitBtn').disabled = false
    this.shadowRoot.getElementById('submitBtn').style.display = 'block'
    this.shadowRoot.getElementById('nextBtn').style.display = 'none'
    this.shadowRoot.getElementById('singleResult').style.display = 'none'

    // Focus the input
    this.shadowRoot.getElementById('numberInput').focus()
  }

  handleSingleSubmit() {
    const input = this.shadowRoot.getElementById('numberInput')
    const userNumber = parseInt(input.value)

    if (isNaN(userNumber)) {
      alert('Please enter a valid number')
      return
    }

    // Disable input
    input.disabled = true
    this.shadowRoot.getElementById('submitBtn').disabled = true

    // Show loading
    this.shadowRoot.getElementById('loadingScreen').style.display = 'block'
    this.shadowRoot.getElementById('singleMode').style.display = 'none'

    // Wait 5 seconds before showing result
    setTimeout(() => {
      this.showSingleResult(userNumber)
    }, 5000)
  }

  showSingleResult(userNumber) {
    const userTemperature = 125 - userNumber
    const correctTemperature = 125 - this.currentCity.secretNumber

    const resultDiv = this.shadowRoot.getElementById('singleResult')
    resultDiv.style.display = 'block'

    if (userNumber === this.currentCity.secretNumber) {
      resultDiv.className = 'result correct'
      resultDiv.innerHTML = `
        Correct! 🎉<br>
        ${this.currentCity.name}<br>
        Temperature: ${correctTemperature}°F
      `
    } else {
      resultDiv.className = 'result incorrect'
      resultDiv.innerHTML = `
        Not quite! 🤔<br>
        ${this.currentCity.name}<br>
        Temperature: ${correctTemperature}°F
      `
    }

    // Hide loading and show results
    this.shadowRoot.getElementById('loadingScreen').style.display = 'none'
    this.shadowRoot.getElementById('singleMode').style.display = 'block'
    this.shadowRoot.getElementById('submitBtn').style.display = 'none'
    this.shadowRoot.getElementById('nextBtn').style.display = 'block'
  }

  addCity() {
    const nameInput = this.shadowRoot.getElementById('cityNameInput')
    const numberInput = this.shadowRoot.getElementById('cityNumberInput')

    const cityName = nameInput.value.trim()
    const secretNumber = parseInt(numberInput.value)

    if (!cityName) {
      alert('Please enter a city name')
      return
    }

    if (isNaN(secretNumber)) {
      alert('Please enter a valid number')
      return
    }

    this.cityList.push({ cityName, secretNumber })

    nameInput.value = ''
    numberInput.value = ''
    nameInput.focus()

    this.updateCityList()
  }

  updateCityList() {
    const cityListDiv = this.shadowRoot.getElementById('cityList')
    const citiesContainer = this.shadowRoot.getElementById('citiesContainer')
    const submitAllBtn = this.shadowRoot.getElementById('submitAllBtn')

    if (this.cityList.length === 0) {
      cityListDiv.style.display = 'none'
      submitAllBtn.style.display = 'none'
    } else {
      cityListDiv.style.display = 'block'
      submitAllBtn.style.display = 'block'

      citiesContainer.innerHTML = this.cityList.map((city, index) => `
        <div class="city-item">
          <span><strong>${city.cityName}</strong></span>
          <button class="remove-btn" data-index="${index}">Remove</button>
        </div>
      `).join('')

      // Add remove button listeners
      citiesContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'))
          this.cityList.splice(index, 1)
          this.updateCityList()
        })
      })
    }
  }

  handleMultipleSubmit() {
    if (this.cityList.length === 0) {
      alert('Please add at least one city')
      return
    }

    // Hide inputs and show results immediately (no spinner)
    this.shadowRoot.getElementById('multipleMode').style.display = 'none'

    // Wait 5 seconds before showing results
    setTimeout(() => {
      this.showMultipleResults()
    }, 5000)
  }

  showMultipleResults() {
    const resultsDiv = this.shadowRoot.getElementById('multipleResults')

    const resultsHTML = this.cityList.map(city => {
      const temperature = 125 - city.secretNumber
      return `
        <div class="result correct" style="margin-bottom: 10px;">
          <strong>${city.cityName}</strong>: ${temperature}°F
        </div>
      `
    }).join('')

    resultsDiv.innerHTML = `
      <div class="results-list">
        <h2 style="text-align: center;">Your City Temperatures</h2>
        ${resultsHTML}
        <button id="resetBtn">Create New Cities</button>
      </div>
    `

    // Show results
    resultsDiv.style.display = 'block'

    // Add reset button listener
    const resetBtn = this.shadowRoot.getElementById('resetBtn')
    resetBtn.addEventListener('click', () => {
      this.cityList = []
      resultsDiv.style.display = 'none'
      this.shadowRoot.getElementById('multipleMode').style.display = 'block'
      this.updateCityList()
    })
  }

  disconnectedCallback() {
    // Cleanup if needed
  }
}

customElements.define('temperature-game', TemperatureGame)
