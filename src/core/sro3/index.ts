class TideGame extends HTMLElement {
  private timeInput: HTMLInputElement;
  private tideDisplay: HTMLDivElement;
  private tideHeight: HTMLDivElement;
  private tideInfo: HTMLDivElement;
  
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
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input[type="time"] {
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
        
        .tide-info {
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
      </style>
      
      <div class="container">
        <div class="input-section">
          <label for="timeInput">Set Time:</label>
          <input type="time" id="timeInput" value="12:00">
        </div>
        
        <div class="tide-container">
          <div class="tide-height"></div>
        </div>
        
        <div class="tide-info">
          <div class="tide-value">0.0 ft</div>
          <div class="tide-label">Tide Level</div>
        </div>
      </div>
    `;
    
    this.timeInput = this.shadowRoot.querySelector('#timeInput') as HTMLInputElement;
    this.tideDisplay = this.shadowRoot.querySelector('.tide-container') as HTMLDivElement;
    this.tideHeight = this.shadowRoot.querySelector('.tide-height') as HTMLDivElement;
    this.tideInfo = this.shadowRoot.querySelector('.tide-value') as HTMLDivElement;
  }

  private setupEventListeners() {
    this.timeInput?.addEventListener('change', () => this.updateTide());
    this.timeInput?.addEventListener('input', () => this.updateTide());
  }

  private calculateTide(hour: number, minute: number): number {
    const totalMinutes = hour * 60 + minute;
    
    if (totalMinutes === 360) return 6;
    if (totalMinutes === 720) return 3;
    if (totalMinutes === 1080) return 10.5;
    if (totalMinutes === 0 || totalMinutes === 1440) return -3.19;
    
    let prevTime: number, nextTime: number, prevTide: number, nextTide: number;
    
    if (totalMinutes < 360) {
      prevTime = 0; nextTime = 360;
      prevTide = -3.19; nextTide = 6;
    } else if (totalMinutes < 720) {
      prevTime = 360; nextTime = 720;
      prevTide = 6; nextTide = 3;
    } else if (totalMinutes < 1080) {
      prevTime = 720; nextTime = 1080;
      prevTide = 3; nextTide = 10.5;
    } else {
      prevTime = 1080; nextTime = 1440;
      prevTide = 10.5; nextTide = -3.19;
    }
    
    const t = (totalMinutes - prevTime) / (nextTime - prevTime);
    const cosineInterpolation = (1 - Math.cos(t * Math.PI)) / 2;
    
    return prevTide + (nextTide - prevTide) * cosineInterpolation;
  }

  private updateTide() {
    if (!this.timeInput || !this.tideHeight || !this.tideInfo) return;
    
    const [hours, minutes] = this.timeInput.value.split(':').map(Number);
    const tideLevel = this.calculateTide(hours, minutes);
    
    const minTide = -4;
    const maxTide = 11;
    const percentage = ((tideLevel - minTide) / (maxTide - minTide)) * 100;
    
    this.tideHeight.style.height = `${Math.max(0, Math.min(100, percentage))}%`;
    this.tideInfo.textContent = `${tideLevel.toFixed(2)} ft`;
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro3-app', TideGame);
}
