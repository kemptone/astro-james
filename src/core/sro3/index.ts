class TideGame extends HTMLElement {
  private timeInput: HTMLInputElement;
  private tideFeetInput: HTMLInputElement;
  private tideDisplay: HTMLDivElement;
  private tideHeight: HTMLDivElement;
  private tideInfo: HTMLDivElement;
  private nextTideInfo: HTMLDivElement;
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateTide();
  }

  private render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .container {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .input-section {
          margin-bottom: 20px;
        }
        
        .input-row {
          display: flex;
          gap: 10px;
          align-items: end;
        }
        
        .input-group {
          flex: 1;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input[type="time"], input[type="number"] {
          width: 100%;
          padding: 8px;
          border: 2px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .tide-container {
          border: 3px solid #0066cc;
          height: 300px;
          width: 100%;
          position: relative;
          background: linear-gradient(to bottom, #87CEEB 0%, #4682B4 100%);
          overflow: hidden;
          border-radius: 8px;
        }
        
        .tide-height {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: linear-gradient(to top, #1e3c72 0%, #2a5298 100%);
          transition: height 0.5s ease-in-out;
          border-radius: 0 0 4px 4px;
        }
        
        .tide-info, .next-tide-info {
          margin-top: 10px;
          padding: 10px;
          background: #f0f8ff;
          border-radius: 4px;
          text-align: center;
        }
        
        .tide-value {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        
        .tide-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        .next-tide-info {
          background: #fff8e1;
          border: 1px solid #ffc107;
        }
        
        .next-tide-value {
          font-size: 18px;
          font-weight: bold;
          color: #ff6f00;
        }
      </style>
      
      <div class="container">
        <div class="input-section">
          <div class="input-row">
            <div class="input-group">
              <label for="timeInput">Set Time:</label>
              <input type="time" id="timeInput" value="12:00">
            </div>
            <div class="input-group">
              <label for="tideFeetInput">Tide Feet:</label>
              <input type="number" id="tideFeetInput" value="5.35" step="0.01" min="0" max="15">
            </div>
          </div>
        </div>
        
        <div class="tide-container">
          <div class="tide-height"></div>
        </div>
        
        <div class="tide-info">
          <div class="tide-value">0.0 ft</div>
          <div class="tide-label">Current Tide Level</div>
        </div>
        
        <div class="next-tide-info">
          <div class="next-tide-value">Next tide in 0h 0m</div>
          <div class="tide-label">Next Tide Prediction</div>
        </div>
      </div>
    `;
    
    this.timeInput = this.shadowRoot.querySelector('#timeInput') as HTMLInputElement;
    this.tideFeetInput = this.shadowRoot.querySelector('#tideFeetInput') as HTMLInputElement;
    this.tideDisplay = this.shadowRoot.querySelector('.tide-container') as HTMLDivElement;
    this.tideHeight = this.shadowRoot.querySelector('.tide-height') as HTMLDivElement;
    this.tideInfo = this.shadowRoot.querySelector('.tide-value') as HTMLDivElement;
    this.nextTideInfo = this.shadowRoot.querySelector('.next-tide-value') as HTMLDivElement;
  }

  private setupEventListeners() {
    this.timeInput?.addEventListener('change', () => this.updateTide());
    this.timeInput?.addEventListener('input', () => this.updateTide());
    this.tideFeetInput?.addEventListener('change', () => this.updateTide());
    this.tideFeetInput?.addEventListener('input', () => this.updateTide());
  }

  private getTideSchedule() {
    return [
      { time: 0, type: 'low low', level: 8.4 },      // midnight
      { time: 360, type: 'high', level: 8.4 },       // 6:00 AM
      { time: 720, type: 'low', level: 8.4 },        // 12:00 PM
      { time: 1080, type: 'high high', level: 8.4 },  // 6:00 PM
      { time: 1440, type: 'low low', level: 8.4 }     // midnight (next day)
    ];
  }

  private findNextTide(currentMinutes: number) {
    const schedule = this.getTideSchedule();
    
    for (let i = 0; i < schedule.length; i++) {
      if (schedule[i].time > currentMinutes) {
        return schedule[i];
      }
    }
    
    return { time: 1440, type: 'low low', level: 8.4 };
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  private calculateTimeUntilNext(currentMinutes: number, nextMinutes: number): string {
    let diff = nextMinutes - currentMinutes;
    if (diff <= 0) diff += 1440;
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }

  private updateTide() {
    if (!this.timeInput || !this.tideFeetInput || !this.tideHeight || !this.tideInfo || !this.nextTideInfo) return;
    
    const [hours, minutes] = this.timeInput.value.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;
    const userTideFeet = parseFloat(this.tideFeetInput.value) || 0;
    
    // Calculate displayed tide using 8.4ft baseline
    const displayedTide = 8.4 - userTideFeet;
    
    // Find next tide
    const nextTide = this.findNextTide(currentMinutes);
    const timeUntilNext = this.calculateTimeUntilNext(currentMinutes, nextTide.time);
    
    // Update display
    const minTide = -10;
    const maxTide = 10;
    const percentage = ((displayedTide - minTide) / (maxTide - minTide)) * 100;
    
    this.tideHeight.style.height = `${Math.max(0, Math.min(100, percentage))}%`;
    this.tideInfo.textContent = `${displayedTide.toFixed(2)} ft`;
    this.nextTideInfo.textContent = `${nextTide.type} in ${timeUntilNext}`;
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro3-app', TideGame);
}
