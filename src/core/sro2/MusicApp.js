import * as Tone from 'tone'
import * as Vex from 'vexflow'

const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const allNotes = []
for (let idx = 0; idx < 26; idx++) {
  const noteLetter = noteLetters[idx % 7]
  const octave = 3 + Math.floor(idx / 7)
  allNotes.push(`${noteLetter}${octave}`)
}

class MusicApp extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.sequence = []
    this.synth = null
    this.seq = null
    this.pianoKeys = []
    this.isPlaying = false
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        select,
        textarea,
        input {
          padding:10px;
        }
        textarea {
          min-height:400px;
          width:100%;
        }
        button {
          padding:10px;
        }
        .piano {
          display: flex;
          flex-direction: row;
        }
        .piano-key {
          background-color: white;
          border: 1px solid black;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          box-sizing: border-box;
          padding: 5px;
        }
      </style>
      <div style="padding: 20px;">
        <form id="inputForm">
          <div>
            <textarea colspan="10" rowspan="10" type="text" id="sentenceInput" placeholder="Enter a sentence"></textarea>
          </div>
          <button type="submit">Submit</button>
        </form>
          <select id="oscType">
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
          <button id="playButton" style="margin-top: 10px;">Play Sequence</button>
          <label style="margin-left: 10px;"><input type="checkbox" id="loopToggle"> Loop</label>
        <div id="results" style="display: none;">
          <h3>Musical Notation:</h3>
          <div id="notation" style="margin: 20px 0; overflow-x: auto;"></div>
          <h3>Piano Roll (Keyboard Visualization):</h3>
          <div class="piano" id="piano"></div>
        </div>
      </div>
    `

    this.synth = new Tone.Synth().toDestination()

    const form = this.shadowRoot.getElementById('inputForm')
    form.addEventListener('submit', this.handleSubmit.bind(this))

    this.playButton = this.shadowRoot.getElementById('playButton')
    this.playButton.addEventListener('click', this.handlePlay.bind(this))

    // Create piano keys
    const pianoDiv = this.shadowRoot.getElementById('piano')
    allNotes.forEach((note, i) => {
      const keyElement = document.createElement('div')
      keyElement.className = 'piano-key'
      keyElement.textContent = `${note}`
      pianoDiv.appendChild(keyElement)
      this.pianoKeys[i] = keyElement
    })
  }

  async handleSubmit(e) {
    e.preventDefault()
    await Tone.start()

    const input = this.shadowRoot
      .getElementById('sentenceInput')
      .value.toUpperCase()
    const newSequence = []
    for (let char of input) {
      if (char >= 'A' && char <= 'Z') {
        const idx = char.charCodeAt(0) - 'A'.charCodeAt(0)
        const noteLetter = noteLetters[idx % 7]
        const octave = 3 + Math.floor(idx / 7)
        newSequence.push({note: `${noteLetter}${octave}`, duration: '8n'})
      } else if (char === ' ') {
        newSequence.push({note: null, duration: '8n'})
      }
    }

    this.sequence = newSequence

    this.renderNotation()
    this.shadowRoot.getElementById('results').style.display = 'block'
  }

  renderNotation() {
    const VF = Vex
    const notationDiv = this.shadowRoot.getElementById('notation')
    notationDiv.innerHTML = ''
    const numMeasures = Math.ceil(this.sequence.length / 8)
    const staveWidth = 400
    const measureHeight = 120
    const totalHeight = measureHeight * numMeasures + 40
    const renderer = new VF.Renderer(notationDiv, VF.Renderer.Backends.SVG)
    renderer.resize(staveWidth + 40, totalHeight)
    const context = renderer.getContext()

    let beams = []
    for (let i = 0; i < numMeasures; i++) {
      const start = i * 8
      const end = Math.min(start + 8, this.sequence.length)
      const measureSequence = this.sequence.slice(start, end)
      let measureNotes = measureSequence.map(item => {
        if (item.note) {
          const key = `${item.note[0].toLowerCase()}/${item.note.slice(1)}`
          return new VF.StaveNote({clef: 'treble', keys: [key], duration: '8'})
        }
        return new VF.StaveNote({clef: 'treble', keys: ['b/4'], duration: '8r'})
      })

      // Pad the last measure with rests if incomplete
      if (measureNotes.length < 8) {
        while (measureNotes.length < 8) {
          measureNotes.push(
            new VF.StaveNote({clef: 'treble', keys: ['b/4'], duration: '8r'}),
          )
        }
      }

      const y = 20 + i * measureHeight
      const stave = new VF.Stave(10, y, staveWidth)
      if (i === 0) {
        stave.addClef('treble').addTimeSignature('4/4')
      }
      stave.setContext(context).draw()

      const voice = new VF.Voice({num_beats: 4, beat_value: 4})
      voice.addTickables(measureNotes)

      new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 50)

      voice.draw(context, stave)

      const measureBeams = VF.Beam.generateBeams(measureNotes)
      beams.push(...measureBeams)
    }

    beams.forEach(b => {
      b.setContext(context).draw()
    })
  }

  handlePlay() {
    const oscType = this.shadowRoot.getElementById('oscType').value
    this.synth.oscillator.type = oscType

    const loopChecked = this.shadowRoot.getElementById('loopToggle').checked

    if (this.isPlaying) {
      Tone.Transport.stop()
      if (this.seq) this.seq.stop()
      this.isPlaying = false
      this.playButton.textContent = 'Play Sequence'
    } else {
      if (this.seq) {
        this.seq.dispose()
      }

      this.seq = new Tone.Sequence(
        (time, val) => {
          if (val.note) {
            this.synth.triggerAttackRelease(val.note, val.duration, time)

            const noteIndex = allNotes.indexOf(val.note)
            const keyElement = this.pianoKeys[noteIndex]
            if (keyElement) {
              keyElement.style.backgroundColor = 'yellow'
              const durSec = Tone.Time(val.duration).toSeconds()
              setTimeout(
                () => {
                  keyElement.style.backgroundColor = 'white'
                },
                durSec * 1000 - 50,
              )
            }
          }
        },
        this.sequence,
        '8n',
      )

      this.seq.loop = loopChecked

      Tone.Transport.start()
      this.seq.start(0)

      this.isPlaying = true
      this.playButton.textContent = 'Stop'

      if (!loopChecked) {
        const stepDur = Tone.Time('8n').toSeconds()
        const totalDur = this.sequence.length * stepDur
        setTimeout(
          () => {
            Tone.Transport.stop()
            if (this.seq) this.seq.stop()
            this.isPlaying = false
            this.playButton.textContent = 'Play Sequence'
          },
          totalDur * 1000 + 100,
        )
      }
    }
  }

  disconnectedCallback() {
    if (this.seq) this.seq.dispose()
    this.synth.dispose()
  }
}

customElements.define('music-app', MusicApp)
