class GridGame extends HTMLElement {
  private shadow: ShadowRoot
  private occupied: boolean[][]
  private cursor: {r: number; c: number} | null
  private gridEl: HTMLDivElement
  private inputEl: HTMLInputElement
  private buttonEl: HTMLButtonElement
  private errorEl: HTMLDivElement
  private cursorEl: HTMLDivElement

  constructor() {
    super()
    this.shadow = this.attachShadow({mode: 'open'})
    this.occupied = Array.from({length: 8}, () => Array(8).fill(false))
    this.cursor = {r: 0, c: 0}
  }

  connectedCallback() {
    this.setupStyles()
    this.setupElements()
    this.updateCursorDisplay()
  }

  private setupStyles() {
    const style = document.createElement('style')
    style.textContent = `
        .grid {
          display: grid;
          grid-template-columns: repeat(8, 50px);
          grid-template-rows: repeat(8, 50px);
          gap: 2px;
          background-color: #f0f0f0;
          margin-bottom: 10px;
        }
        .shape {
          background-color: #4CAF50;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          border: 1px solid #333;
        }
        .cursor {
          border: 2px solid red;
          pointer-events: none;
          z-index: 10;
        }
        .error {
          color: red;
          margin-top: 5px;
        }
        input {
          padding: 5px;
          margin-right: 5px;
          min-width: 200px;
        }
        button {
          padding: 5px;
        }
      `
    this.shadow.appendChild(style)
  }

  private setupElements() {
    this.gridEl = document.createElement('div')
    this.gridEl.classList.add('grid')

    this.inputEl = document.createElement('input')
    this.inputEl.type = 'number'
    this.inputEl.min = '1'
    this.inputEl.max = '64'
    this.inputEl.placeholder = 'Enter number 1-64'

    this.buttonEl = document.createElement('button')
    this.buttonEl.textContent = 'Submit'

    this.errorEl = document.createElement('div')
    this.errorEl.classList.add('error')

    const form = document.createElement('div')
    form.appendChild(this.inputEl)
    form.appendChild(this.buttonEl)
    form.appendChild(this.errorEl)

    this.shadow.appendChild(this.gridEl)
    this.shadow.appendChild(form)

    this.cursorEl = document.createElement('div')
    this.cursorEl.classList.add('cursor')
    this.gridEl.appendChild(this.cursorEl)

    this.buttonEl.addEventListener('click', this.handleSubmit.bind(this))
  }

  private handleSubmit() {
    this.errorEl.textContent = ''
    try {
      const value = parseInt(this.inputEl.value, 10)
      if (isNaN(value) || value < 1 || value > 64) {
        throw new Error('Invalid number. Must be between 1 and 64.')
      }
      this.placeShape(value)
      this.inputEl.value = ''
    } catch (e) {
      this.errorEl.textContent = (e as Error).message
    }
  }

  private placeShape(n: number) {
    if (!this.cursor) {
      throw new Error('Grid is full.')
    }
    const {width: w, height: h} = this.getSize(n)
    const {r, c} = this.cursor

    // Check bounds
    if (r + h > 8 || c + w > 8) {
      throw new Error('Shape falls outside the grid.')
    }

    // Check overlap
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (this.occupied[r + i][c + j]) {
          throw new Error('Shape overlaps with existing shape.')
        }
      }
    }

    // Place
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.occupied[r + i][c + j] = true
      }
    }

    // Add visual element
    const shapeEl = document.createElement('div')
    shapeEl.classList.add('shape')
    shapeEl.style.gridRow = `${r + 1} / span ${h}`
    shapeEl.style.gridColumn = `${c + 1} / span ${w}`
    shapeEl.textContent = n.toString()
    this.gridEl.appendChild(shapeEl)

    // Advance cursor
    this.findNextCursor()
    this.updateCursorDisplay()

    // Check if full
    if (!this.cursor) {
      // alert('Grid is fully filled!')
      this.dispatchEvent(new CustomEvent('game-over'))
    }
  }

  private getSize(n: number): {width: number; height: number} {
    const height = Math.ceil(n / 8)
    const width = ((n - 1) % 8) + 1
    return {width, height}
  }

  private findNextCursor() {
    for (let rr = 0; rr < 8; rr++) {
      for (let cc = 0; cc < 8; cc++) {
        if (!this.occupied[rr][cc]) {
          this.cursor = {r: rr, c: cc}
          return
        }
      }
    }
    this.cursor = null
  }

  private updateCursorDisplay() {
    if (this.cursor) {
      this.cursorEl.style.display = 'block'
      this.cursorEl.style.gridRow = `${this.cursor.r + 1} / span 1`
      this.cursorEl.style.gridColumn = `${this.cursor.c + 1} / span 1`
    } else {
      this.cursorEl.style.display = 'none'
    }
  }
}

customElements.define('grid-game', GridGame)
