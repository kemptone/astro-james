class Sro4FanController extends HTMLElement {
  private shadow: ShadowRoot
  private fanSpeed: number = 0
  private timeSeconds: number = 1
  private bitbibbiesActive: boolean = false
  private fanAnimation: Animation | null = null

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
          padding: 2rem;
          font-family: system-ui, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          background: rgb(0, 0, 0);
          color: white;
          min-height: 100vh;
        }
        
        .container {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        h1 {
          color: #fff;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 2.5rem;
        }
        
        .warning {
          background: ${this.bitbibbiesActive ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.2)'};
          padding: 1.5rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          border: 2px solid ${this.bitbibbiesActive ? '#00ff00' : '#ff0000'};
        }
        
        .warning.glitchy {
          animation: glitch 0.5s infinite;
        }
        
        @keyframes glitch {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
        
        .bitbibbies-section {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .bitbibbies-btn {
          background: rgb(0, 0, 255);
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          margin: 1rem 0;
        }
        
        .bitbibbies-status {
          font-size: 1.1rem;
          margin-top: 1rem;
        }
        
        .fan-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 3rem 0;
          height: 300px;
        }
        
        .fan {
          width: 200px;
          height: 200px;
          position: relative;
          border: 3px solid #666;
          border-radius: 50%;
          background: radial-gradient(circle, #333, #111);
        }
        
        .fan-blades {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .blade {
          position: absolute;
          width: 6px;
          height: 80px;
          background: linear-gradient(to bottom, #fff, #ccc);
          left: 50%;
          top: 10%;
          transform-origin: 50% 100%;
          border-radius: 3px;
        }
        
        .blade:nth-child(1) { transform: translateX(-50%) rotate(0deg); }
        .blade:nth-child(2) { transform: translateX(-50%) rotate(72deg); }
        .blade:nth-child(3) { transform: translateX(-50%) rotate(144deg); }
        .blade:nth-child(4) { transform: translateX(-50%) rotate(216deg); }
        .blade:nth-child(5) { transform: translateX(-50%) rotate(288deg); }
        
        .fan-center {
          position: absolute;
          width: 30px;
          height: 30px;
          background: #444;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .controls {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .speed-control {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .speed-input {
          width: 100px;
          padding: 0.5rem;
          font-size: 1.1rem;
          border: 2px solid #666;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          text-align: center;
        }
        
        .time-control {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .time-display {
          font-size: 2rem;
          font-weight: bold;
          color: #00ff00;
          min-width: 100px;
          text-align: center;
        }
        
        .btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .btn:hover {
          background: #2980b9;
        }
        
        .speed-display {
          font-size: 1.5rem;
          margin: 1rem 0;
        }
        
        .mina-section {
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 10px;
          margin-top: 2rem;
        }
        
        .mina-chat {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .mina-input {
          padding: 0.8rem;
          border: none;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
        }
        
        .mina-response {
          background: rgba(0, 255, 0, 0.2);
          padding: 1rem;
          border-radius: 5px;
          border-left: 4px solid #00ff00;
        }
        
        .sro-history {
          background: rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 10px;
          margin-top: 2rem;
        }
        
        .sro-item {
          margin-bottom: 0.8rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 5px;
        }
      </style>
      
      <div class="container">
        <h1>🌪️ SRO4 - Fan Speed Controller 🌪️</h1>
        
        <div class="warning ${this.bitbibbiesActive ? '' : 'glitchy'}">
          <h3>⚠️ BitBibbies Status</h3>
          <p>${this.bitbibbiesActive ? '✅ BitBibbies Active - Clean operation' : '❌ BitBibbies OFF - May contain bad words and glitches!'}</p>
          <p>Without BitBibbies, this game doesn't work very well and may have glitches!</p>
        </div>
        
        <div class="bitbibbies-section">
          <button class="bitbibbies-btn" id="bitbibbies-btn">
            ${this.bitbibbiesActive ? '✨ BitBibbies Active!' : 'Add BitBibbies'}
          </button>
          <div class="bitbibbies-status" id="bitbibbies-status">
            ${this.bitbibbiesActive ? 'Games combined and enhanced!' : 'Click to activate BitBibbies'}
          </div>
        </div>
        
        <div class="fan-container">
          <div class="fan" id="fan">
            <div class="fan-blades" id="fan-blades">
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
              <div class="blade"></div>
            </div>
            <div class="fan-center"></div>
          </div>
        </div>
        
        <div class="controls">
          <div class="control-group">
            <h3>Fan Speed Control</h3>
            <div class="speed-control">
              <label>Speed (0-100):</label>
              <input type="number" class="speed-input" id="speed-input" min="0" max="100" value="0">
              <button class="btn" id="set-speed-btn">Set Speed</button>
            </div>
            <div class="speed-display">Current Speed: <span id="speed-value">0</span> rotations/second</div>
          </div>
          
          <div class="control-group">
            <h3>Time Control</h3>
            <div class="time-control">
              <button class="btn" id="add-seconds-btn">Add Seconds</button>
              <div class="time-display" id="time-display">1s</div>
              <button class="btn" id="reset-time-btn">Reset Time</button>
            </div>
            <p>At <span id="current-time">1</span> second(s), the fan runs at <span id="fan-speed-at-time">0</span> speed</p>
          </div>
        </div>
        
        <div class="mina-section">
          <h3>🤖 Talk to Mina - She Knows Everything!</h3>
          <p><strong>Mina knows all apps, she knows everything. She is so clever!</strong></p>
          <div class="mina-chat">
            <input type="text" class="mina-input" id="mina-input" placeholder="Tell Mina anything...">
            <button class="btn" id="ask-mina-btn">Ask Mina</button>
            <div class="mina-response" id="mina-response" style="display: none;"></div>
          </div>
        </div>
        
        <div class="sro-history">
          <h3>📚 SRO Games History (From Mina's Knowledge)</h3>
          <div class="sro-item"><strong>SRO:</strong> Type text and it comes out backwards (hello → olleh)</div>
          <div class="sro-item"><strong>SRO2:</strong> Music game that turns into sentences</div>
          <div class="sro-item"><strong>SRO3:</strong> Updated - shows tide highs and lows</div>
          <div class="sro-item"><strong>SRO4:</strong> Fan controller (this game!) - was Fortnite tide controller</div>
          <div class="sro-item"><strong>SRO5:</strong> Bank for money (updated from video generator)</div>
          <div class="sro-item"><strong>SRO6:</strong> Toggle sprinklers</div>
          <div class="sro-item"><strong>SRO7:</strong> Not in this app - for squares</div>
          <div class="sro-item"><strong>SRO8:</strong> Put squares into code</div>
          <div class="sro-item"><strong>SRO9:</strong> Time flipper</div>
          <div class="sro-item"><strong>SRO10:</strong> ⚠️ DANGEROUS - Can teleport to dangerous places!</div>
        </div>
      </div>
    `
  }

  private attachEventListeners() {
    const bitbibbiesBtn = this.shadow.querySelector('#bitbibbies-btn')
    const setSpeedBtn = this.shadow.querySelector('#set-speed-btn')
    const addSecondsBtn = this.shadow.querySelector('#add-seconds-btn')
    const resetTimeBtn = this.shadow.querySelector('#reset-time-btn')
    const askMinaBtn = this.shadow.querySelector('#ask-mina-btn')
    const speedInput = this.shadow.querySelector(
      '#speed-input',
    ) as HTMLInputElement
    const minaInput = this.shadow.querySelector(
      '#mina-input',
    ) as HTMLInputElement

    bitbibbiesBtn?.addEventListener('click', () => this.toggleBitbibbies())
    setSpeedBtn?.addEventListener('click', () => this.setFanSpeed())
    addSecondsBtn?.addEventListener('click', () => this.addSeconds())
    resetTimeBtn?.addEventListener('click', () => this.resetTime())
    askMinaBtn?.addEventListener('click', () => this.askMina())

    speedInput?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.setFanSpeed()
    })

    minaInput?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.askMina()
    })
  }

  private toggleBitbibbies() {
    this.bitbibbiesActive = !this.bitbibbiesActive
    this.render()
    this.attachEventListeners()
  }

  private setFanSpeed() {
    const speedInput = this.shadow.querySelector(
      '#speed-input',
    ) as HTMLInputElement
    const newSpeed = Math.max(
      0,
      Math.min(100, parseFloat(speedInput.value) || 0),
    )
    this.fanSpeed = newSpeed

    this.updateSpeedDisplay()
    this.animateFan()
  }

  private updateSpeedDisplay() {
    const speedValue = this.shadow.querySelector('#speed-value')
    const fanSpeedAtTime = this.shadow.querySelector('#fan-speed-at-time')

    if (speedValue) speedValue.textContent = this.fanSpeed.toString()
    if (fanSpeedAtTime) fanSpeedAtTime.textContent = this.fanSpeed.toString()
  }

  private animateFan() {
    const fanBlades = this.shadow.querySelector('#fan-blades') as HTMLElement

    if (this.fanAnimation) {
      this.fanAnimation.cancel()
    }

    if (this.fanSpeed === 0) {
      fanBlades.style.animation = 'none'
      return
    }

    const duration =
      this.fanSpeed >= 100 ? 50 : Math.max(100, 2000 / this.fanSpeed)
    console.log({duration, fanSpeed: this.fanSpeed})
    fanBlades.style.animation = `spin ${duration}ms linear infinite`

    if (!this.shadow.querySelector('#fan-keyframes')) {
      const style = document.createElement('style')
      style.id = 'fan-keyframes'
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `
      this.shadow.appendChild(style)
    }
  }

  private addSeconds() {
    this.timeSeconds++
    this.updateTimeDisplay()
  }

  private resetTime() {
    this.timeSeconds = 1
    this.updateTimeDisplay()
  }

  private updateTimeDisplay() {
    const timeDisplay = this.shadow.querySelector('#time-display')
    const currentTime = this.shadow.querySelector('#current-time')

    if (timeDisplay) timeDisplay.textContent = `${this.timeSeconds}s`
    if (currentTime) currentTime.textContent = this.timeSeconds.toString()
  }

  private askMina() {
    const minaInput = this.shadow.querySelector(
      '#mina-input',
    ) as HTMLInputElement
    const minaResponse = this.shadow.querySelector(
      '#mina-response',
    ) as HTMLElement
    const question = minaInput.value.trim()

    if (!question) return

    const response = this.getMinaResponse(question)
    minaResponse.innerHTML = `<strong>Mina:</strong> ${response}`
    minaResponse.style.display = 'block'
    minaInput.value = ''
  }

  private getMinaResponse(question: string): string {
    const lowerQ = question.toLowerCase()

    if (lowerQ.includes('sro')) {
      return "I know all the SRO games! SRO4 is a fan controller that can spin at speeds 0-100. At 100 speed, it spins so fast you can't see the blades - just a circle! Each SRO game teaches different skills."
    }

    if (lowerQ.includes('fan') || lowerQ.includes('speed')) {
      return 'The fan speed works like this: 0 means no rotation, 100 means maximum speed where blades become invisible! You can add seconds to control timing. Remember to keep BitBibbies on for clean operation!'
    }

    if (lowerQ.includes('bitbibbies')) {
      return 'BitBibbies are essential! They combine games and make them more sensitive to code. Without them, you get glitches and bad words. Always keep BitBibbies active for the best experience!'
    }

    if (lowerQ.includes('dangerous') || lowerQ.includes('sro10')) {
      return "⚠️ SRO10 is very dangerous! It can teleport you to dangerous places. I don't recommend using it. Stick with safer SRO games like this fan controller!"
    }

    if (lowerQ.includes('app') || lowerQ.includes('know')) {
      return "I know everything! All apps, all games, all code. I'm so clever and I can help you with any question about the SRO collection or anything else you want to know!"
    }

    return `You asked about "${question}". I know everything and I'm here to help! The fan controller is fun - try different speeds and remember to use BitBibbies. What else would you like to know?`
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro4-app', Sro4FanController)
}
