const GRID_WIDTH = 40
const NUM_ACROSS = 12
const NUM_DOWN = 12
const NOTE_FUN = 8

type SettingsType = {
  grid_width : number
  num_accross : number
  num_down : number
  note_fun : number
}

class GridGame extends HTMLElement {
  private occupied: boolean[][]
  private cursor: {r: number; c: number} | null
  private gridEl: HTMLDivElement
  private inputEl: HTMLInputElement
  private cursorEl: HTMLDivElement
  private shapes: number[] = []

  constructor() {
    super()
    this.occupied = Array.from({length: NUM_ACROSS}, () => Array(NUM_DOWN).fill(false))
    this.cursor = {r: 0, c: 0}

    const defaultElement = document.createElement("div")
    this.gridEl = defaultElement
    this.inputEl = document.createElement('input')
    this.cursorEl = defaultElement
  }

  setSettings (settings : SettingsType) {
    this
    debugger
  }

  connectedCallback() {
    this.setupTemplate()
    this.setupElements()
    this.updateCursorDisplay()
  }

  // Public method to access the shapes array
  getShapes(): number[] {
    return [...this.shapes] // Return a copy to prevent external modification
  }

  private setupTemplate() {
    this.innerHTML = `
      <style>
        .grid {
          display: grid;
          grid-template-columns: repeat(${ NUM_ACROSS }, ${ GRID_WIDTH }px);
          grid-template-rows: repeat(${ NUM_DOWN }, ${ GRID_WIDTH }px);
          gap: 2px;
          margin-bottom: 10px;
          background-color:var(--background-color, #eee);
        }
        .shape {
          background-color: var(--shape-color, #000);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .cursor {
          border: 2px solid var(--cursor-color, pink);
          pointer-events: none;
          z-index: 10;
        }
        input {
          padding: 5px;
          margin-right: 5px;
          min-width: 200px;
        }
        button {
          padding: 5px;
        }
        form.mina-form {
        }
      </style>
      <form class="mina-form">
        <input type="number" min="1" max="64" placeholder="Enter number 1-64">
        <button type="submit">Submit</button>
      </form>
      <div class="grid">
        <div class="cursor"></div>
      </div>
    `
  }

  private setupElements() {
    this.gridEl = this.querySelector('.grid') as HTMLDivElement
    this.inputEl = this.querySelector('input') as HTMLInputElement
    this.cursorEl = this.querySelector('.cursor') as HTMLDivElement

    const form = this.querySelector('form') as HTMLFormElement
    form.addEventListener('submit', e => {
      e.preventDefault()
      this.handleSubmit()
    })

    // Clear custom validity when user starts typing
    this.inputEl.addEventListener('input', () => {
      this.inputEl.setCustomValidity('')
    })
  }

  private handleSubmit() {
    try {
      const value = parseInt(this.inputEl.value, 10)
      if (isNaN(value) || value < 1 || value > 64) {
        throw new Error('Invalid number. Must be between 1 and 64.')
      }
      this.shapes.push(value)
      this.placeShape(value)
      this.inputEl.setCustomValidity('')
      this.inputEl.value = ''
      console.log({ value })
    } catch (e) {
      this.inputEl.setCustomValidity((e as Error).message)
      this.inputEl.reportValidity()
    }
  }

  private placeShape(n: number) {
    if (!this.cursor) {
      throw new Error('Grid is full.')
    }
    const {width: w, height: h} = this.getSize(n)
    const {r, c} = this.cursor

    // Check bounds
    if (r + h > NUM_DOWN || c + w > NUM_ACROSS) {
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
    const height = Math.ceil(n / NOTE_FUN)
    const width = ((n - 1) % NOTE_FUN) + 1
    return {width, height}
  }

  private findNextCursor() {
    for (let rr = 0; rr < NUM_ACROSS; rr++) {
      for (let cc = 0; cc < NUM_DOWN; cc++) {
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

// Export the class type for use by other components
export type GridGameElement = GridGame
export { GridGame }
