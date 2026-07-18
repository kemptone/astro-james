type FanKey = 'fan1' | 'fan2'

type TimelineEntry = {
  fan1: number
  fan2: number
}

class Sro4FanController extends HTMLElement {
  private shadow: ShadowRoot
  private timeline: TimelineEntry[] = [
    {fan1: 0, fan2: 0},
    {fan1: 0, fan2: 0},
  ]
  private bitbibbiesActive = false
  private isPlaying = false
  private playbackStartMs = 0
  private playbackTimeMs = 0
  private rafId: number | null = null
  private fanAngles = [0, 0]

  constructor() {
    super()
    this.shadow = this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    this.render()
    this.attachEventListeners()
    this.resetFans()
  }

  disconnectedCallback() {
    this.cancelPlayback()
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          padding: 2rem;
          color: #f9fbff;
          font-family: "Trebuchet MS", "Avenir Next", sans-serif;
          background:
            radial-gradient(circle at top, rgba(79, 172, 254, 0.18), transparent 36%),
            radial-gradient(circle at bottom, rgba(0, 242, 254, 0.12), transparent 42%),
            rgb(0, 0, 0);
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(16px);
        }

        h1,
        h2,
        h3 {
          margin: 0;
        }

        h1 {
          text-align: center;
          font-size: clamp(2.2rem, 4vw, 3.5rem);
          letter-spacing: 0.04em;
          margin-bottom: 1rem;
        }

        .intro {
          max-width: 820px;
          margin: 0 auto 1.5rem;
          text-align: center;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.88);
        }

        .rule-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
          margin: 1.5rem 0 2rem;
        }

        .rule-card,
        .warning,
        .panel,
        .mina-section,
        .sro-history {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
        }

        .rule-card {
          padding: 1rem;
          text-align: center;
        }

        .rule-card strong {
          display: block;
          font-size: 1.25rem;
          margin-bottom: 0.35rem;
        }

        .warning {
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          border-color: ${this.bitbibbiesActive ? 'rgba(90, 255, 157, 0.75)' : 'rgba(255, 109, 109, 0.7)'};
          background: ${this.bitbibbiesActive ? 'rgba(25, 110, 56, 0.18)' : 'rgba(120, 19, 19, 0.22)'};
        }

        .warning.glitchy {
          animation: glitch 0.55s infinite;
        }

        @keyframes glitch {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }

        .bitbibbies-section,
        .button-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }

        .bitbibbies-section {
          margin-bottom: 2rem;
        }

        .bitbibbies-status {
          flex-basis: 100%;
          text-align: center;
          color: rgba(255, 255, 255, 0.84);
        }

        .fans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
          margin: 2rem 0;
        }

        .fan-card {
          padding: 1.25rem;
          text-align: center;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background:
            radial-gradient(circle at center, rgba(255, 255, 255, 0.12), transparent 48%),
            rgba(6, 12, 24, 0.82);
        }

        .fan-stage {
          display: grid;
          place-items: center;
          min-height: 280px;
        }

        .fan {
          position: relative;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.22);
          background:
            radial-gradient(circle at center, rgba(210, 242, 255, 0.26), rgba(40, 75, 102, 0.28) 48%, rgba(2, 7, 14, 0.9) 78%);
          box-shadow:
            inset 0 0 40px rgba(255, 255, 255, 0.08),
            0 20px 50px rgba(0, 0, 0, 0.38);
        }

        .fan-ring {
          position: absolute;
          inset: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.09);
        }

        .fan-blades {
          position: absolute;
          inset: 0;
          will-change: transform;
        }

        .blade {
          position: absolute;
          left: 50%;
          top: 16px;
          width: 12px;
          height: 92px;
          transform-origin: 50% calc(100% - 8px);
          margin-left: -6px;
          border-radius: 999px 999px 12px 12px;
          background: linear-gradient(180deg, #ffffff, #a7d8ff 65%, #66b0f4);
          box-shadow: 0 0 14px rgba(167, 216, 255, 0.35);
        }

        .fan-center {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 42px;
          height: 42px;
          margin-left: -21px;
          margin-top: -21px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.2);
          background: radial-gradient(circle, #f9fdff, #5f7f99 58%, #18242f);
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.25);
        }

        .fan-readout {
          margin-top: 0.75rem;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.88);
        }

        .panel {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .button-row {
          margin-top: 1rem;
        }

        button {
          border: none;
          border-radius: 999px;
          padding: 0.85rem 1.25rem;
          font: inherit;
          font-weight: 700;
          color: #04131e;
          cursor: pointer;
          background: linear-gradient(135deg, #7ae2ff, #e3fff7);
          box-shadow: 0 8px 22px rgba(122, 226, 255, 0.25);
        }

        button.secondary {
          color: #f2f6ff;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: none;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .timeline-table-wrap {
          overflow-x: auto;
          margin-top: 1rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 520px;
        }

        th,
        td {
          padding: 0.85rem 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        th {
          font-size: 0.95rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }

        td:first-child,
        th:first-child {
          text-align: left;
        }

        .speed-input {
          width: 92px;
          padding: 0.6rem 0.65rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(3, 12, 24, 0.75);
          color: #f9fbff;
          text-align: center;
          font: inherit;
        }

        .status-board {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .status-pill {
          padding: 0.95rem 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
        }

        .status-pill strong {
          display: block;
          font-size: 1.15rem;
        }

        .mina-section,
        .sro-history {
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .mina-chat {
          display: grid;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .mina-input {
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: none;
          background: rgba(255, 255, 255, 0.92);
          color: #07121c;
          font: inherit;
        }

        .mina-response {
          padding: 1rem;
          border-radius: 14px;
          border-left: 4px solid #7ae2ff;
          background: rgba(122, 226, 255, 0.12);
        }

        .sro-history {
          display: grid;
          gap: 0.7rem;
        }

        .sro-item {
          padding: 0.85rem 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 720px) {
          :host {
            padding: 1rem;
          }

          .container {
            padding: 1.25rem;
          }

          .fan {
            width: 180px;
            height: 180px;
          }

          .blade {
            top: 14px;
            height: 74px;
          }
        }
      </style>

      <div class="container">
        <h1>SRO4 - Two Fan Speed Animation</h1>
        <p class="intro">
          Watch your own fan animation with two fans. Sound is off this time, and the speed scale is
          the important part: <strong>0</strong> means stopped, <strong>5</strong> means one full rotation
          every 2 seconds, and <strong>10</strong> means one full rotation every second. There is no
          maximum speed.
        </p>

        <div class="rule-strip">
          <div class="rule-card">
            <strong>2 Fans</strong>
            Set Fan 1 and Fan 2 for every second.
          </div>
          <div class="rule-card">
            <strong>No Maximum</strong>
            10 is 1 rotation each second, but you can go higher.
          </div>
          <div class="rule-card">
            <strong>5 Blades</strong>
            Both fans have 5 blades, and only the blades spin.
          </div>
          <div class="rule-card">
            <strong>Smooth Ramps</strong>
            5 to 0 fades down across that second.
          </div>
        </div>

        <div class="warning ${this.bitbibbiesActive ? '' : 'glitchy'}">
          <h3>BitBibbies Status</h3>
          <p>${this.bitbibbiesActive ? 'BitBibbies active. Clean operation.' : 'BitBibbies off. This game may glitch a little.'}</p>
          <p>Keeping BitBibbies on still makes the fan game smoother and clearer.</p>
        </div>

        <div class="bitbibbies-section">
          <button id="bitbibbies-btn">${this.bitbibbiesActive ? 'BitBibbies Active' : 'Add BitBibbies'}</button>
          <div class="bitbibbies-status">
            ${this.bitbibbiesActive ? 'Games combined and enhanced.' : 'Click to activate BitBibbies.'}
          </div>
        </div>

        <div class="fans-grid">
          ${this.getFanCardMarkup('fan-1', 'Fan 1')}
          ${this.getFanCardMarkup('fan-2', 'Fan 2')}
        </div>

        <div class="panel">
          <h2>Timeline Controls</h2>
          <p>
            Put in a speed for each second. Playback starts from the first row and moves forward,
            blending one second into the next.
          </p>

          <div class="timeline-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Second</th>
                  <th>Fan 1 Speed</th>
                  <th>Fan 2 Speed</th>
                </tr>
              </thead>
              <tbody>
                ${this.timeline
                  .map(
                    (entry, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>
                          <input
                            class="speed-input"
                            type="number"
                            min="0"
                            step="0.1"
                            value="${entry.fan1}"
                            data-index="${index}"
                            data-fan="fan1"
                          >
                        </td>
                        <td>
                          <input
                            class="speed-input"
                            type="number"
                            min="0"
                            step="0.1"
                            value="${entry.fan2}"
                            data-index="${index}"
                            data-fan="fan2"
                          >
                        </td>
                      </tr>
                    `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="button-row">
            <button id="add-second-btn" class="secondary">Add Second</button>
            <button id="remove-second-btn" class="secondary" ${this.timeline.length <= 1 ? 'disabled' : ''}>Remove Last Second</button>
            <button id="play-btn">Play Animation</button>
            <button id="stop-btn" class="secondary" ${this.isPlaying ? '' : 'disabled'}>Stop</button>
            <button id="reset-btn" class="secondary">Reset Fans</button>
          </div>

          <div class="status-board">
            <div class="status-pill">
              <span>Playback Time</span>
              <strong id="current-time">0.0s</strong>
            </div>
            <div class="status-pill">
              <span>Fan 1 Right Now</span>
              <strong id="fan1-speed-now">0</strong>
            </div>
            <div class="status-pill">
              <span>Fan 2 Right Now</span>
              <strong id="fan2-speed-now">0</strong>
            </div>
            <div class="status-pill">
              <span>Run Length</span>
              <strong>${this.timeline.length} second(s)</strong>
            </div>
          </div>
        </div>

        <div class="mina-section">
          <h3>Talk to Mina</h3>
          <p><strong>Mina still knows everything.</strong> Ask about the fan game, the speed scale, or the SRO collection.</p>
          <div class="mina-chat">
            <input type="text" class="mina-input" id="mina-input" placeholder="Tell Mina anything...">
            <button id="ask-mina-btn">Ask Mina</button>
            <div class="mina-response" id="mina-response" style="display: none;"></div>
          </div>
        </div>

        <div class="sro-history">
          <h3>SRO Games History</h3>
          <div class="sro-item"><strong>SRO:</strong> Type text and it comes out backwards.</div>
          <div class="sro-item"><strong>SRO2:</strong> Music game that turns into sentences.</div>
          <div class="sro-item"><strong>SRO3:</strong> Updated to show tide highs and lows.</div>
          <div class="sro-item"><strong>SRO4:</strong> Fan controller with two timed fan animations.</div>
          <div class="sro-item"><strong>SRO5:</strong> Bank for money, updated from the video generator.</div>
          <div class="sro-item"><strong>SRO6:</strong> Toggle sprinklers.</div>
          <div class="sro-item"><strong>SRO7:</strong> Not in this app. It is for squares.</div>
          <div class="sro-item"><strong>SRO8:</strong> Put squares into code.</div>
          <div class="sro-item"><strong>SRO9:</strong> A time flipper.</div>
          <div class="sro-item"><strong>SRO10:</strong> Dangerous. Best not to use it.</div>
        </div>
      </div>
    `
  }

  private getFanCardMarkup(id: string, label: string) {
    const blades = Array.from({length: 5}, (_, index) => {
      const rotation = index * 72

      return `<div class="blade" style="transform: rotate(${rotation}deg);"></div>`
    }).join('')

    return `
      <div class="fan-card">
        <h2>${label}</h2>
        <div class="fan-stage">
          <div class="fan">
            <div class="fan-ring"></div>
            <div class="fan-blades" id="${id}">${blades}</div>
            <div class="fan-center"></div>
          </div>
        </div>
        <div class="fan-readout" id="${id}-readout">Starting speed: 0</div>
      </div>
    `
  }

  private attachEventListeners() {
    const bitbibbiesBtn = this.shadow.querySelector('#bitbibbies-btn')
    const addSecondBtn = this.shadow.querySelector('#add-second-btn')
    const removeSecondBtn = this.shadow.querySelector('#remove-second-btn')
    const playBtn = this.shadow.querySelector('#play-btn')
    const stopBtn = this.shadow.querySelector('#stop-btn')
    const resetBtn = this.shadow.querySelector('#reset-btn')
    const askMinaBtn = this.shadow.querySelector('#ask-mina-btn')
    const minaInput = this.shadow.querySelector('#mina-input') as HTMLInputElement
    const speedInputs = this.shadow.querySelectorAll('.speed-input')

    bitbibbiesBtn?.addEventListener('click', () => this.toggleBitbibbies())
    addSecondBtn?.addEventListener('click', () => this.addSecond())
    removeSecondBtn?.addEventListener('click', () => this.removeSecond())
    playBtn?.addEventListener('click', () => this.startPlayback())
    stopBtn?.addEventListener('click', () => this.stopPlayback())
    resetBtn?.addEventListener('click', () => this.resetFans())
    askMinaBtn?.addEventListener('click', () => this.askMina())

    minaInput?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.askMina()
    })

    speedInputs.forEach(input => {
      input.addEventListener('input', event => this.updateTimelineSpeed(event))
    })
  }

  private toggleBitbibbies() {
    const wasPlaying = this.isPlaying
    if (wasPlaying) this.stopPlayback()
    this.bitbibbiesActive = !this.bitbibbiesActive
    this.render()
    this.attachEventListeners()
    this.resetFans()
  }

  private addSecond() {
    const lastEntry = this.timeline[this.timeline.length - 1] || {fan1: 0, fan2: 0}
    this.timeline.push({...lastEntry})
    this.refreshUiAfterTimelineShapeChange()
  }

  private removeSecond() {
    if (this.timeline.length <= 1) return
    this.timeline.pop()
    this.refreshUiAfterTimelineShapeChange()
  }

  private refreshUiAfterTimelineShapeChange() {
    if (this.isPlaying) this.stopPlayback()
    this.render()
    this.attachEventListeners()
    this.resetFans()
  }

  private updateTimelineSpeed(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const index = Number(input.dataset.index)
    const fan = input.dataset.fan as FanKey

    if (!Number.isInteger(index) || !fan || !this.timeline[index]) return

    const value = this.clampSpeed(input.value)
    this.timeline[index][fan] = value
    input.value = String(value)

    if (!this.isPlaying) this.updateReadout(0, this.getSpeedsAtTime(0))
  }

  private clampSpeed(rawValue: string | number) {
    const numericValue =
      typeof rawValue === 'number' ? rawValue : parseFloat(rawValue || '0')

    if (!Number.isFinite(numericValue)) return 0

    return Math.max(0, Number(numericValue.toFixed(1)))
  }

  private startPlayback() {
    if (this.isPlaying) return

    this.isPlaying = true
    this.playbackStartMs = performance.now()
    this.playbackTimeMs = 0
    this.fanAngles = [0, 0]
    this.updatePlaybackButtons()
    this.rafId = requestAnimationFrame(timestamp => this.stepPlayback(timestamp))
  }

  private stepPlayback(timestamp: number) {
    if (!this.isPlaying) return

    const totalDurationMs = this.timeline.length * 1000
    const nextPlaybackTimeMs = Math.min(
      timestamp - this.playbackStartMs,
      totalDurationMs,
    )
    const deltaMs = Math.max(0, nextPlaybackTimeMs - this.playbackTimeMs)
    this.playbackTimeMs = nextPlaybackTimeMs

    const speeds = this.getSpeedsAtTime(this.playbackTimeMs)
    this.advanceFans(deltaMs, speeds)
    this.updateReadout(this.playbackTimeMs, speeds)

    if (this.playbackTimeMs >= totalDurationMs) {
      this.finishPlayback()
      return
    }

    this.rafId = requestAnimationFrame(nextTimestamp =>
      this.stepPlayback(nextTimestamp),
    )
  }

  private advanceFans(deltaMs: number, speeds: TimelineEntry) {
    const deltaSeconds = deltaMs / 1000
    const speedsPerFan = [speeds.fan1, speeds.fan2]

    speedsPerFan.forEach((speedLevel, fanIndex) => {
      const rotationsPerSecond = speedLevel / 10
      this.fanAngles[fanIndex] += rotationsPerSecond * 360 * deltaSeconds
    })

    this.applyFanTransforms()
  }

  private applyFanTransforms() {
    const fan1 = this.shadow.querySelector('#fan-1') as HTMLElement | null
    const fan2 = this.shadow.querySelector('#fan-2') as HTMLElement | null

    if (fan1) fan1.style.transform = `rotate(${this.fanAngles[0]}deg)`
    if (fan2) fan2.style.transform = `rotate(${this.fanAngles[1]}deg)`
  }

  private getSpeedsAtTime(timeMs: number): TimelineEntry {
    if (this.timeline.length === 0) {
      return {fan1: 0, fan2: 0}
    }

    const secondsElapsed = Math.max(0, timeMs / 1000)
    const currentIndex = Math.floor(secondsElapsed)
    const safeCurrentIndex = Math.min(currentIndex, this.timeline.length - 1)
    const current = this.timeline[safeCurrentIndex]

    if (safeCurrentIndex >= this.timeline.length - 1) {
      return {...current}
    }

    const next = this.timeline[safeCurrentIndex + 1]
    const progress = secondsElapsed - safeCurrentIndex

    return {
      fan1: this.interpolate(current.fan1, next.fan1, progress),
      fan2: this.interpolate(current.fan2, next.fan2, progress),
    }
  }

  private interpolate(start: number, end: number, progress: number) {
    const nextValue = start + (end - start) * progress
    return Number(nextValue.toFixed(2))
  }

  private finishPlayback() {
    this.cancelPlayback()
    this.isPlaying = false
    this.updatePlaybackButtons()
  }

  private stopPlayback() {
    this.cancelPlayback()
    this.isPlaying = false
    this.resetFans()
    this.updatePlaybackButtons()
  }

  private resetFans() {
    this.playbackTimeMs = 0
    this.fanAngles = [0, 0]
    this.applyFanTransforms()
    this.updateReadout(0, this.getSpeedsAtTime(0))
    this.updatePlaybackButtons()
  }

  private cancelPlayback() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private updatePlaybackButtons() {
    const playBtn = this.shadow.querySelector('#play-btn') as HTMLButtonElement | null
    const stopBtn = this.shadow.querySelector('#stop-btn') as HTMLButtonElement | null

    if (playBtn) playBtn.disabled = this.isPlaying
    if (stopBtn) stopBtn.disabled = !this.isPlaying
  }

  private updateReadout(timeMs: number, speeds: TimelineEntry) {
    const currentTime = this.shadow.querySelector('#current-time')
    const fan1SpeedNow = this.shadow.querySelector('#fan1-speed-now')
    const fan2SpeedNow = this.shadow.querySelector('#fan2-speed-now')
    const fan1Readout = this.shadow.querySelector('#fan-1-readout')
    const fan2Readout = this.shadow.querySelector('#fan-2-readout')

    if (currentTime) currentTime.textContent = `${(timeMs / 1000).toFixed(1)}s`
    if (fan1SpeedNow) fan1SpeedNow.textContent = this.formatSpeed(speeds.fan1)
    if (fan2SpeedNow) fan2SpeedNow.textContent = this.formatSpeed(speeds.fan2)
    if (fan1Readout) {
      fan1Readout.textContent = `Current speed: ${this.formatSpeed(speeds.fan1)}`
    }
    if (fan2Readout) {
      fan2Readout.textContent = `Current speed: ${this.formatSpeed(speeds.fan2)}`
    }
  }

  private formatSpeed(speed: number) {
    return Number(speed.toFixed(2)).toString()
  }

  private askMina() {
    const minaInput = this.shadow.querySelector('#mina-input') as HTMLInputElement
    const minaResponse = this.shadow.querySelector('#mina-response') as HTMLElement
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
      return 'I know the SRO games. SRO4 is the two-fan controller now, and each second can have its own speed for both fans.'
    }

    if (lowerQ.includes('fan') || lowerQ.includes('speed')) {
      return 'The fan speed has no maximum now. Zero means stopped, 5 means one rotation every 2 seconds, and 10 means one rotation every second. Both fans have 5 blades, and only the blades spin.'
    }

    if (lowerQ.includes('bitbibbies')) {
      return 'BitBibbies still help this game stay cleaner and smoother. Turning them on is the best way to play.'
    }

    if (lowerQ.includes('dangerous') || lowerQ.includes('sro10')) {
      return 'SRO10 is still the dangerous one. This fan game is much safer and easier to watch.'
    }

    if (lowerQ.includes('app') || lowerQ.includes('know')) {
      return "I know all the apps and I'm still here to help. Try asking about two fans, timeline speeds, or the smooth speed changes."
    }

    return `You asked about "${question}". The fan game has two fans now, so you can animate both one second at a time.`
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro4-app', Sro4FanController)
}
