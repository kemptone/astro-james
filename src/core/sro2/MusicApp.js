import * as Tone from 'tone';
import Vex from 'vexflow';

const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; // Cycle through C Major white notes: A->C, B->D, etc.

const allNotes = [];
for (let idx = 0; idx < 26; idx++) {
  const noteLetter = noteLetters[idx % 7];
  const octave = 3 + Math.floor(idx / 7);
  allNotes.push(`${noteLetter}${octave}`);
}

class MusicApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sequence = [];
    this.synth = null;
    this.seq = null;
    this.pianoKeys = [];
    this.isPlaying = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .piano {
          display: 200px;
          display: flex;
          flex-direction: row;
        }
        #sentenceInput {
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 600px;
        }
        #inputForm {
          display: flex;
          gap: 10px;
        }
        #inputForm button {
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: 1px solid #ccc;
          background-color: #4CAF50;
          color: white;
        }
        .piano-key {
          width: 200px;
          height: 30px;
          background-color: white;
          border: 1px solid black;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          color: black;
          padding-left: 10px;
        }
      </style>
      <div style="padding: 20px;">
        <form id="inputForm">
          <input type="search" id="sentenceInput" placeholder="Enter a sentence" />
          <button type="submit">Submit</button>
        </form>
        <div id="results" style="display: none;">
          <h3>Musical Notation:</h3>
          <div id="notation" style="margin: 20px 0;"></div>
          <h3>Piano Roll:</h3>
          <div class="piano" id="piano"></div>
          <button id="playButton" style="margin-top: 10px;">Play Sequence</button>
          <label style="margin-left: 10px;"><input type="checkbox" id="loopToggle"> Loop</label>
        </div>
      </div>
    `;

    this.synth = new Tone.Synth().toDestination();

    const form = this.shadowRoot.getElementById('inputForm');
    form.addEventListener('submit', this.handleSubmit.bind(this));

    this.playButton = this.shadowRoot.getElementById('playButton');
    this.playButton.addEventListener('click', this.handlePlay.bind(this));

    // Create piano roll keys
    const pianoDiv = this.shadowRoot.getElementById('piano');
    allNotes.forEach((note, i) => {
      const keyElement = document.createElement('div');
      keyElement.className = 'piano-key';
      // keyElement.textContent = `${note} (${String.fromCharCode(65 + i)})`;
      keyElement.textContent = `${note}`;
      pianoDiv.appendChild(keyElement);
      this.pianoKeys[i] = keyElement;
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    await Tone.start();

    const input = this.shadowRoot.getElementById('sentenceInput').value.toUpperCase();
    const newSequence = [];
    for (let char of input) {
      if (char >= 'A' && char <= 'Z') {
        const idx = char.charCodeAt(0) - 'A'.charCodeAt(0);
        const noteLetter = noteLetters[idx % 7];
        const octave = 3 + Math.floor(idx / 7);
        newSequence.push({ note: `${noteLetter}${octave}`, duration: '8n' });
      } else if (char === ' ') {
        newSequence.push({ note: null, duration: '8n' });
      }
      // Ignore other characters.
    }

    this.sequence = newSequence;

    this.renderNotation();

    const e_results = this.shadowRoot.getElementById('results');
    e_results.style.display = 'block';
    e_results.querySelector('#playButton').click();

  }

  renderNotation() {
    const VF = Vex;
    const notationDiv = this.shadowRoot.getElementById('notation');
    notationDiv.innerHTML = '';
    const renderer = new VF.Renderer(notationDiv, VF.Renderer.Backends.SVG);
    const staveWidth = Math.min(this.sequence.length * 30 + 50, 800); // Cap width to avoid too long.
    renderer.resize(staveWidth + 20, 200);
    const context = renderer.getContext();
    const stave = new VF.Stave(10, 40, staveWidth);
    stave.addClef('treble');
    stave.setContext(context).draw();

    const vfNotes = this.sequence.map((item) => {
      if (item.note) {
        const key = `${item.note[0].toLowerCase()}/${item.note.slice(1)}`;
        return new VF.StaveNote({ clef: 'treble', keys: [key], duration: '8' });
      }
      return new VF.StaveNote({ clef: 'treble', keys: ['b/4'], duration: '8r' });
    });

    VF.Formatter.FormatAndDraw(context, stave, vfNotes);
  }

  handlePlay() {
    const loopChecked = this.shadowRoot.getElementById('loopToggle').checked;

    if (this.isPlaying) {
      Tone.Transport.stop();
      if (this.seq) this.seq.stop();
      this.isPlaying = false;
      this.playButton.textContent = 'Play Sequence';
    } else {
      if (this.seq) {
        this.seq.dispose();
      }

      this.seq = new Tone.Sequence(
        (time, val) => {
          if (val.note) {
            this.synth.triggerAttackRelease(val.note, val.duration, time);

            const noteIndex = allNotes.indexOf(val.note);
            const keyElement = this.pianoKeys[noteIndex];
            if (keyElement) {
              keyElement.style.backgroundColor = 'yellow';
              const durSec = Tone.Time(val.duration).toSeconds();
              setTimeout(() => {
                keyElement.style.backgroundColor = 'white';
              }, durSec * 1000 - 50); // Approximate unhighlight.
            }
          }
        },
        this.sequence,
        '8n'
      );

      this.seq.loop = loopChecked;

      Tone.Transport.start();
      this.seq.start(0);

      this.isPlaying = true;
      this.playButton.textContent = 'Stop';

      if (!loopChecked) {
        const stepDur = Tone.Time('8n').toSeconds();
        const totalDur = this.sequence.length * stepDur;
        setTimeout(() => {
          Tone.Transport.stop();
          if (this.seq) this.seq.stop();
          this.isPlaying = false;
          this.playButton.textContent = 'Play Sequence';
        }, totalDur * 1000 + 100); // Slight buffer
      }
    }
  }

  disconnectedCallback() {
    if (this.seq) this.seq.dispose();
    this.synth.dispose();
  }
}

customElements.define('music-app', MusicApp);