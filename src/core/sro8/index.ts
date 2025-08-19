class Sro8 extends HTMLElement {
  private shadow: ShadowRoot
  private squares: boolean[] = new Array(9).fill(false)

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
          max-width: 600px;
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
          font-size: 2.5rem;
        }
        
        .subtitle {
          text-align: center;
          color: #7f8c8d;
          margin-bottom: 2rem;
          font-size: 1.2rem;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 100px);
          grid-template-rows: repeat(3, 100px);
          gap: 10px;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .square {
          width: 100px;
          height: 100px;
          border: 3px solid black;
          background-color: rgb(128, 128, 128);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          transition: background-color 0.3s ease;
        }
        
        .square.on {
          background-color: yellow;
        }
        
        .controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .inputs {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        label {
          font-weight: bold;
          color: #34495e;
          font-size: 0.9rem;
        }
        
        input[type="number"] {
          width: 60px;
          height: 40px;
          text-align: center;
          font-size: 1.2rem;
          border: 2px solid #bdc3c7;
          border-radius: 6px;
          padding: 0;
        }
        
        input[type="number"]:focus {
          outline: none;
          border-color: #3498db;
        }
        
        button {
          background: #3498db;
          color: white;
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
        }
        
        button:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }
        
        .description {
          background: #ecf0f1;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 2rem;
          font-size: 0.9rem;
          line-height: 1.5;
          color: #2c3e50;
        }
        
        .pattern-info {
          margin-top: 1rem;
          font-weight: bold;
          text-align: center;
          color: #e74c3c;
        }
        .description {
          display:none;
        }
      </style>
      
      <div class="container">
        <h1>SRO8 🔳</h1>
        <p class="subtitle">Square Controller - Pattern Generator</p>
        
        <div class="grid">
          <div class="square" data-index="0">1</div>
          <div class="square" data-index="1">2</div>
          <div class="square" data-index="2">3</div>
          <div class="square" data-index="3">4</div>
          <div class="square" data-index="4">5</div>
          <div class="square" data-index="5">6</div>
          <div class="square" data-index="6">7</div>
          <div class="square" data-index="7">8</div>
          <div class="square" data-index="8">9</div>
        </div>
        
        <div class="controls">
          <div class="inputs">
            <div class="input-group">
              <label>Squares 1-3</label>
              <input type="number" id="input1" min="1" max="8" value="1">
            </div>
            <div class="input-group">
              <label>Squares 4-6</label>
              <input type="number" id="input2" min="1" max="8" value="1">
            </div>
            <div class="input-group">
              <label>Squares 7-9</label>
              <input type="number" id="input3" min="1" max="8" value="1">
            </div>
          </div>
          <button id="submitBtn">Submit</button>
        </div>
        
        <div class="description">
          <strong>How it works:</strong><br>
          • Yellow squares = ON<br>
          • Gray squares = OFF<br>
          • Each number (1-8) controls a different pattern for its group of 3 squares<br>
          • When all three numbers are the same, you get symmetric patterns<br>
          • Different numbers create unique combinations
          
          <div class="pattern-info" id="patternInfo">
            Enter numbers and click Submit to see the pattern!
          </div>
        </div>
      </div>
    `
  }

  private attachEventListeners() {
    const submitBtn = this.shadow.querySelector(
      '#submitBtn',
    ) as HTMLButtonElement
    submitBtn?.addEventListener('click', () => this.updatePattern())
  }

  private updatePattern() {
    const input1 = this.shadow.querySelector('#input1') as HTMLInputElement
    const input2 = this.shadow.querySelector('#input2') as HTMLInputElement
    const input3 = this.shadow.querySelector('#input3') as HTMLInputElement

    const num1 = parseInt(input1.value) || 1
    const num2 = parseInt(input2.value) || 1
    const num3 = parseInt(input3.value) || 1

    // Clamp values between 1-8
    const clampedNum1 = Math.max(1, Math.min(8, num1))
    const clampedNum2 = Math.max(1, Math.min(8, num2))
    const clampedNum3 = Math.max(1, Math.min(8, num3))

    // Update input values if they were clamped
    input1.value = clampedNum1.toString()
    input2.value = clampedNum2.toString()
    input3.value = clampedNum3.toString()

    // Reset all squares
    this.squares.fill(false)

    // Apply patterns for each group
    this.applyPattern(clampedNum1, 0) // Squares 1-3 (indices 0-2)
    this.applyPattern(clampedNum2, 3) // Squares 4-6 (indices 3-5)
    this.applyPattern(clampedNum3, 6) // Squares 7-9 (indices 6-8)

    // Update visual display
    this.updateSquareDisplay()

    // Update pattern info
    this.updatePatternInfo(clampedNum1, clampedNum2, clampedNum3)
  }

  private applyPattern(number: number, startIndex: number) {
    // Pattern definitions based on the specification
    switch (number) {
      case 1: // only 1 is on
        this.squares[startIndex] = true
        break
      case 2: // only 1 and 2 are on
        this.squares[startIndex] = true
        this.squares[startIndex + 1] = true
        break
      case 3: // all are on
        this.squares[startIndex] = true
        this.squares[startIndex + 1] = true
        this.squares[startIndex + 2] = true
        break
      case 4: // only 2 and 3 are on
        this.squares[startIndex + 1] = true
        this.squares[startIndex + 2] = true
        break
      case 5: // only 3 is on
        this.squares[startIndex + 2] = true
        break
      case 6: // none are on
        // All remain false
        break
      case 7: // just 2 is on
        this.squares[startIndex + 1] = true
        break
      case 8: // only 1 and 3 are on
        this.squares[startIndex] = true
        this.squares[startIndex + 2] = true
        break
    }
  }

  private updateSquareDisplay() {
    const squareElements = this.shadow.querySelectorAll('.square')
    squareElements.forEach((square, index) => {
      if (this.squares[index]) {
        square.classList.add('on')
      } else {
        square.classList.remove('on')
      }
    })
  }

  private updatePatternInfo(num1: number, num2: number, num3: number) {
    const patternInfo = this.shadow.querySelector('#patternInfo')
    if (!patternInfo) return

    if (num1 === num2 && num2 === num3) {
      // All numbers are the same - symmetric pattern
      const descriptions = {
        1: 'Only squares 1, 4, and 7 are ON',
        2: 'Squares 1, 2, 4, 5, 7, and 8 are ON',
        3: 'All squares are ON',
        4: 'Squares 2, 3, 5, 6, 8, and 9 are ON',
        5: 'Only squares 3, 6, and 9 are ON',
        6: 'All squares are OFF',
        7: 'Only squares 2, 5, and 8 are ON',
        8: 'Squares 1, 3, 4, 6, 7, and 9 are ON',
      }
      patternInfo.textContent = `Symmetric Pattern (${num1}): ${descriptions[num1 as keyof typeof descriptions]}`
    } else {
      // Different numbers - custom pattern
      const onSquares = this.squares
        .map((isOn, index) => (isOn ? index + 1 : null))
        .filter(num => num !== null)

      if (onSquares.length === 0) {
        patternInfo.textContent = `Custom Pattern (${num1}-${num2}-${num3}): All squares are OFF`
      } else {
        patternInfo.textContent = `Custom Pattern (${num1}-${num2}-${num3}): Squares ${onSquares.join(', ')} are ON`
      }
    }
  }
}

if (typeof window !== 'undefined') {
  customElements.define('sro8-app', Sro8)
}
