class Sro4 extends HTMLElement {
  private shadow: ShadowRoot

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.render()
    this.attachEventListeners()
  }

  disconnectedCallback() {
    const form = this.shadow.querySelector('#timeForm')
    if (form) {
      form.removeEventListener('submit', this.handleTimeSubmit)
    }
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 2rem;
          font-family: system-ui, sans-serif;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .container {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .description {
          background: #e3f2fd;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid #2196f3;
        }
        
        .input-group {
          margin-bottom: 2rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #34495e;
        }
        
        input[type="time"] {
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1.1rem;
          width: 200px;
        }
        
        button {
          background: #3498db;
          color: white;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
          margin-left: 1rem;
        }
        
        button:hover {
          background: #2980b9;
        }
        
        .results {
          margin-top: 2rem;
          display: none;
        }
        
        .results.show {
          display: block;
        }
        
        .tide-card {
          background: white;
          padding: 1.5rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          border-left: 4px solid #27ae60;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .tide-card.low {
          border-left-color: #e74c3c;
        }
        
        .tide-card.high {
          border-left-color: #3498db;
        }
        
        .tide-type {
          font-weight: bold;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }
        
        .tide-time {
          font-size: 1.1rem;
          color: #666;
        }
      </style>
      
      <div class="container">
        <h1>SRO4 - Fortnite Tide Calculator</h1>
        
        <div class="description">
          <p><strong>How it works:</strong></p>
          <ul>
            <li>Enter a time of day</li>
            <li>Omega Low Tide = Your chosen time</li>
            <li>Alpha High Tide = 6 hours after your time</li>
            <li>Alpha Low Tide = 12 hours after your time</li>
            <li>Omega High Tide = 18 hours after your time</li>
          </ul>
        </div>
        
        <form id="timeForm">
          <div class="input-group">
            <label for="timeInput">Enter Time of Day:</label>
            <input type="time" id="timeInput" required>
            <button type="submit">Calculate Tides</button>
          </div>
        </form>
        
        <div id="results" class="results">
          <h2>Tide Schedule</h2>
          <div id="tideCards"></div>
        </div>
      </div>
    `
  }

  private attachEventListeners() {
    const form = this.shadow.querySelector('#timeForm')
    if (form) {
      form.addEventListener('submit', this.handleTimeSubmit.bind(this))
    }
  }

  private handleTimeSubmit = (e: Event) => {
    e.preventDefault()
    const timeInput = this.shadow.querySelector('#timeInput') as HTMLInputElement
    const inputTime = timeInput.value
    
    if (!inputTime) return
    
    this.calculateTides(inputTime)
  }

  private calculateTides(inputTime: string) {
    const [hours, minutes] = inputTime.split(':').map(Number)
    const baseTime = hours * 60 + minutes // Convert to minutes
    
    const tides = [
      { name: 'Omega Low Tide', hours: 0, type: 'low' },
      { name: 'Alpha High Tide', hours: 6, type: 'high' },
      { name: 'Alpha Low Tide', hours: 12, type: 'low' },
      { name: 'Omega High Tide', hours: 18, type: 'high' }
    ]
    
    const results = tides.map(tide => {
      const tideTimeMinutes = (baseTime + tide.hours * 60) % (24 * 60)
      const tideHours = Math.floor(tideTimeMinutes / 60)
      const tideMins = tideTimeMinutes % 60
      
      const date = new Date()
      date.setHours(tideHours, tideMins, 0, 0)
      
      return {
        ...tide,
        time: new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(date)
      }
    })
    
    this.displayResults(results)
  }

  private displayResults(tides: Array<{name: string, time: string, type: string}>) {
    const resultsDiv = this.shadow.querySelector('#results')
    const tideCardsDiv = this.shadow.querySelector('#tideCards')
    
    if (!resultsDiv || !tideCardsDiv) return
    
    const cardsHTML = tides.map(tide => `
      <div class="tide-card ${tide.type}">
        <div class="tide-type">${tide.name}</div>
        <div class="tide-time">${tide.time}</div>
      </div>
    `).join('')
    
    tideCardsDiv.innerHTML = cardsHTML
    resultsDiv.classList.add('show')
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro4-app', Sro4)
}
