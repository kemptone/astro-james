class TimeProgressionApp extends HTMLElement {
  private timeInput: HTMLInputElement;
  private submitBtn: HTMLButtonElement;
  private timeGrid: HTMLDivElement;
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  private render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .input-section {
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 15px;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }
        
        label {
          display: block;
          font-size: 1.2rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }
        
        input[type="time"] {
          font-size: 1.5rem;
          padding: 0.8rem;
          border: none;
          border-radius: 10px;
          text-align: center;
          margin-right: 1rem;
          width: 200px;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .submit-btn {
          font-size: 1.2rem;
          padding: 0.8rem 2rem;
          background: linear-gradient(45deg, #ff6b6b, #ffa726);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        
        .time-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-top: 2rem;
        }
        
        .time-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 1rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .time-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        .hour-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #ffd54f;
          margin-bottom: 0.5rem;
        }
        
        .actual-time {
          font-size: 1.1rem;
          color: #4fc3f7;
          font-family: 'Courier New', monospace;
        }
        
        .time-description {
          font-size: 0.9rem;
          color: #e0e0e0;
          margin-top: 0.5rem;
        }
        
        .hidden {
          display: none;
        }
        
        .explanation {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 1.5rem;
          margin-top: 2rem;
          backdrop-filter: blur(5px);
        }
        
        .explanation h3 {
          color: #ffd54f;
          margin-bottom: 1rem;
        }
        
        .explanation p {
          margin: 0.5rem 0;
          line-height: 1.5;
        }
      </style>
      
      <div class="container">
        <h1>🕐 Submit Rosie's Operation $3 🕐</h1>
        
        <div class="input-section">
          <label for="timeInput">Set Your Base Time:</label>
          <input type="time" id="timeInput" value="12:00">
          <button class="submit-btn" id="submitBtn">📤 Submit & Show 24 Hours</button>
        </div>
        
        <div class="time-grid hidden" id="timeGrid">
          <!-- Time cards will be populated here -->
        </div>
        
        <div class="explanation">
          <h3>How it works:</h3>
          <p><strong>0</strong> = Your chosen time</p>
          <p><strong>23</strong> = 1 hour before your time</p>
          <p><strong>13</strong> = 11 hours before your time</p>
          <p><strong>12</strong> = The opposite AM/PM of your time</p>
        </div>
      </div>
    `;
    
    this.timeInput = this.shadowRoot.querySelector('#timeInput') as HTMLInputElement;
    this.submitBtn = this.shadowRoot.querySelector('#submitBtn') as HTMLButtonElement;
    this.timeGrid = this.shadowRoot.querySelector('#timeGrid') as HTMLDivElement;
  }

  private setupEventListeners() {
    this.submitBtn?.addEventListener('click', () => this.showTimeProgression());
    this.timeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.showTimeProgression();
      }
    });
  }

  private parseTime(timeStr: string): { hours: number, minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private formatTime(hours: number, minutes: number): string {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private getTimeDescription(hourNumber: number, baseHours: number): string {
    if (hourNumber === 0) {
      return "Your chosen time";
    } else if (hourNumber === 12) {
      const basePeriod = baseHours >= 12 ? 'PM' : 'AM';
      const oppositePeriod = basePeriod === 'AM' ? 'PM' : 'AM';
      return `Opposite ${oppositePeriod} (12 hours different)`;
    } else if (hourNumber === 23) {
      return "1 hour before your time";
    } else if (hourNumber === 13) {
      return "11 hours before your time";
    } else if (hourNumber < 12) {
      return `${24 - hourNumber} hours before your time`;
    } else {
      return `${24 - hourNumber} hours before your time`;
    }
  }

  private showTimeProgression() {
    if (!this.timeInput || !this.timeGrid) return;
    
    const { hours: baseHours, minutes: baseMinutes } = this.parseTime(this.timeInput.value);
    
    // Clear existing content
    this.timeGrid.innerHTML = '';
    
    // Generate all 24 hours (0-23)
    for (let hourNumber = 0; hourNumber <= 23; hourNumber++) {
      // Calculate actual time based on the logic:
      // 0 = user's time, 23 = 1 hour before, 13 = 11 hours before, etc.
      const hoursBack = hourNumber === 0 ? 0 : 24 - hourNumber;
      
      let actualHours = baseHours - hoursBack;
      let actualMinutes = baseMinutes;
      
      // Handle day overflow/underflow
      if (actualHours < 0) {
        actualHours += 24;
      } else if (actualHours >= 24) {
        actualHours -= 24;
      }
      
      const timeCard = document.createElement('div');
      timeCard.className = 'time-card';
      
      timeCard.innerHTML = `
        <div class="hour-number">${hourNumber}</div>
        <div class="actual-time">${this.formatTime(actualHours, actualMinutes)}</div>
        <div class="time-description">${this.getTimeDescription(hourNumber, baseHours)}</div>
      `;
      
      this.timeGrid.appendChild(timeCard);
    }
    
    // Show the grid with animation
    this.timeGrid.classList.remove('hidden');
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro3-app', TimeProgressionApp);
}
