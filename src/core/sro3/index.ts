import {getMicrosoftVoices, playTextAzure} from '../talkers2/wc-talkers.helpers'
import type {AzureVoiceInfo} from '../talkers2/types'

type WordLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7

type ReadingWord = {
  id: string
  text: string
  level: WordLevel
  createdAt: number
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

class Sro3WordLevelGame extends HTMLElement {
  private readonly storageKey = 'sro3-word-level-game'
  private readonly voiceStorageKey = 'sro3-reader-voice'
  private readonly missingWordsSecret = 'yes'
  private readonly defaultReaderVoiceName = 'Goldenspark - HD - Latest'
  private words: ReadingWord[] = []
  private selectedLevel: 1 | 2 | 3 | 4 | 5 | 6 = 1
  private activeWordIndex = 0
  private missingWordsUnlocked = false
  private statusMessage = 'Add a word, choose its level, then read it in the game.'
  private statusTone: 'neutral' | 'good' | 'bad' = 'neutral'
  private voices: AzureVoiceInfo[] = []
  private selectedVoiceShortName = ''
  private voicesAreLoading = false
  private voiceLoadFailed = false
  private currentAudio: HTMLAudioElement | null = null
  private lastReadText = ''

  constructor() {
    super()
    this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    this.loadWords()
    this.loadSelectedVoice()
    this.render()
    this.loadTalkersTwoVoices()
  }

  private render() {
    if (!this.shadowRoot) return

    const visibleWords = this.getVisibleWords()
    if (this.activeWordIndex >= visibleWords.length) this.activeWordIndex = 0
    const activeWord = visibleWords[this.activeWordIndex] ?? null
    const normalWords = this.words.filter(word => word.level !== 7)
    const missingWords = this.words.filter(word => word.level === 7)
    const currentLevelLabel =
      this.selectedLevel === 6 ? 'Bonus level 6' : `Level ${this.selectedLevel}`
    const selectedVoice = this.getSelectedVoice()
    const selectedVoiceLabel = selectedVoice
      ? this.getVoiceLabel(selectedVoice)
      : this.selectedVoiceShortName || this.defaultReaderVoiceName
    const spokenWordList = this.formatWordList(visibleWords.map(word => word.text))
    const readableWordCount = this.getReadAllWords().length

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          color: #14213d;
          font-family: Arial, Helvetica, sans-serif;
          background:
            linear-gradient(180deg, #f8fbff 0%, #e8f3ea 48%, #fff4d6 100%);
        }

        * {
          box-sizing: border-box;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          border: 0;
          border-radius: 8px;
          min-height: 44px;
          padding: 0.75rem 1rem;
          font-weight: 800;
          cursor: pointer;
          color: #ffffff;
          background: #2b6cb0;
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(20, 33, 61, 0.16);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
          box-shadow: none;
        }

        button.secondary {
          color: #14213d;
          background: #ffffff;
          border: 2px solid #bfd1df;
        }

        button.warning {
          background: #b94a48;
        }

        .app {
          width: min(1180px, calc(100% - 2rem));
          margin: 0 auto;
          padding: 2rem 0 3rem;
        }

        .topbar {
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          margin-bottom: 1.5rem;
        }

        .eyebrow {
          margin: 0 0 0.35rem;
          color: #2f855a;
          font-size: 0.84rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(2rem, 5vw, 4rem);
          line-height: 1;
        }

        .subtitle {
          max-width: 58rem;
          margin-top: 0.85rem;
          color: #334155;
          font-size: 1.05rem;
          line-height: 1.5;
        }

        .level-row,
        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .level-button {
          min-width: 4.2rem;
          color: #14213d;
          background: #ffffff;
          border: 2px solid #bfd1df;
        }

        .level-button.is-active {
          color: #ffffff;
          background: #2f855a;
          border-color: #2f855a;
        }

        .level-button.is-bonus {
          border-color: #e0a82e;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
          gap: 1rem;
          align-items: start;
        }

        .panel {
          padding: 1.25rem;
          border: 2px solid rgba(20, 33, 61, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 18px 45px rgba(20, 33, 61, 0.08);
        }

        .reader {
          display: grid;
          min-height: 360px;
          gap: 1rem;
          align-content: space-between;
        }

        .reader-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
        }

        .reader-title {
          display: grid;
          gap: 0.35rem;
        }

        .reader-title strong {
          color: #64748b;
          font-size: 0.92rem;
        }

        .word-stage {
          display: grid;
          gap: 1rem;
          align-content: center;
          justify-items: center;
          min-height: 210px;
          padding: 1rem;
          border: 3px dashed #c9d8e4;
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(47, 133, 90, 0.1), rgba(224, 168, 46, 0.14)),
            #ffffff;
          text-align: center;
        }

        .big-list {
          width: 100%;
          overflow-wrap: anywhere;
          color: #111827;
          font-size: clamp(2.2rem, 7vw, 5.7rem);
          font-weight: 900;
          line-height: 1.08;
        }

        .visible-word-grid {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.55rem;
        }

        .visible-word-button {
          min-height: 48px;
          padding: 0.55rem;
          overflow-wrap: anywhere;
          color: #14213d;
          background: #ffffff;
          border: 2px solid #d8e2eb;
          box-shadow: none;
        }

        .visible-word-button.is-active {
          color: #ffffff;
          background: #2f855a;
          border-color: #2f855a;
        }

        .picked-word {
          width: 100%;
          padding: 0.75rem 0.85rem;
          border: 1px solid #d8e2eb;
          border-radius: 8px;
          color: #334155;
          background: rgba(255, 255, 255, 0.82);
          font-weight: 800;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .empty-word {
          max-width: 28rem;
          color: #526174;
          font-size: 1.2rem;
          line-height: 1.45;
        }

        .counter {
          color: #334155;
          font-weight: 800;
        }

        form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 7rem auto;
          gap: 0.75rem;
          align-items: end;
        }

        label {
          display: grid;
          gap: 0.35rem;
          color: #334155;
          font-weight: 800;
        }

        input,
        select {
          width: 100%;
          min-height: 46px;
          border: 2px solid #bfd1df;
          border-radius: 8px;
          padding: 0.75rem;
          color: #14213d;
          background: #ffffff;
        }

        input:focus,
        select:focus {
          border-color: #2b6cb0;
          outline: 3px solid rgba(43, 108, 176, 0.18);
        }

        .voice-control {
          display: grid;
          gap: 0.45rem;
          padding: 0.85rem;
          border: 1px solid #d8e2eb;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.74);
        }

        .voice-control label {
          color: #14213d;
        }

        .status {
          margin-top: 0.9rem;
          padding: 0.8rem 0.9rem;
          border-radius: 8px;
          color: #334155;
          background: #eef6ff;
          border: 1px solid #c8dcf5;
          font-weight: 700;
        }

        .status.good {
          color: #22543d;
          background: #e7f7ee;
          border-color: #b7e3c8;
        }

        .status.bad {
          color: #8a2424;
          background: #fff0f0;
          border-color: #f0c0c0;
        }

        .word-bank {
          display: grid;
          gap: 0.65rem;
          margin-top: 1rem;
        }

        .word-item {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          gap: 0.6rem;
          align-items: center;
          min-height: 58px;
          padding: 0.7rem;
          border: 1px solid #d8e2eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .word-item strong {
          overflow-wrap: anywhere;
        }

        .pill {
          justify-self: start;
          min-width: 4.4rem;
          padding: 0.35rem 0.55rem;
          border-radius: 8px;
          color: #14213d;
          background: #f5e7b8;
          text-align: center;
          font-size: 0.86rem;
          font-weight: 900;
        }

        .locked {
          color: #64748b;
          font-style: italic;
        }

        .tiny-button {
          min-height: 36px;
          padding: 0.45rem 0.65rem;
          font-size: 0.86rem;
        }

        .missing-panel {
          margin-top: 1rem;
          border-color: #e0a82e;
          background: #fffaf0;
        }

        .missing-panel[hidden] {
          display: none;
        }

        .missing-list {
          display: grid;
          gap: 0.65rem;
          margin-top: 0.8rem;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
        }

        @media (max-width: 820px) {
          .topbar,
          .layout,
          form {
            grid-template-columns: 1fr;
          }

          .reader-head,
          .section-head {
            align-items: stretch;
            flex-direction: column;
          }
        }
      </style>

      <main class="app">
        <header class="topbar">
          <div>
            <p class="eyebrow">Submit Rosie's Operation $3</p>
            <h1>Word Level Reader</h1>
            <p class="subtitle">
              Level 1 words show in every normal level. Level 2 starts at level 2.
              Level 5 waits for the highest normal level. Level 6 is bonus only.
              Level 7 stays in Missing Words.
            </p>
          </div>
          <button class="secondary" id="missing-words-button" type="button">Missing Words</button>
        </header>

        <section class="level-row" aria-label="Choose reading level">
          ${[1, 2, 3, 4, 5, 6]
            .map(
              level => `
                <button
                  class="level-button ${level === this.selectedLevel ? 'is-active' : ''} ${level === 6 ? 'is-bonus' : ''}"
                  type="button"
                  data-level="${level}"
                >
                  ${level === 6 ? 'Bonus 6' : `Level ${level}`}
                  (${this.getVisibleWordsForLevel(level as 1 | 2 | 3 | 4 | 5 | 6).length})
                </button>
              `,
            )
            .join('')}
        </section>

        <section class="layout" aria-label="SRO3 word game">
          <article class="panel reader">
            <div class="reader-head">
              <div class="reader-title">
                <h2>${currentLevelLabel}</h2>
                <strong>${this.getLevelRuleText()}</strong>
              </div>
              <p class="counter">${visibleWords.length ? `${this.activeWordIndex + 1} of ${visibleWords.length}` : '0 words'}</p>
            </div>

            <div class="word-stage" aria-live="polite">
              ${
                activeWord
                  ? `
                    <div class="big-list">${escapeHtml(spokenWordList)}</div>
                    <div class="visible-word-grid" aria-label="Words in this level">
                      ${visibleWords
                        .map(
                          (word, index) => `
                            <button
                              class="visible-word-button ${index === this.activeWordIndex ? 'is-active' : ''}"
                              type="button"
                              data-show-word="${index}"
                            >
                              ${escapeHtml(word.text)}
                            </button>
                          `,
                        )
                        .join('')}
                    </div>
                    <p class="picked-word">Picked word: ${escapeHtml(activeWord.text)}</p>
                  `
                  : `<p class="empty-word">No words are showing on ${escapeHtml(currentLevelLabel)} yet.</p>`
              }
            </div>

            <div class="voice-control">
              <label for="voice-select">Talkers Two voice</label>
              <select id="voice-select" ${this.voices.length ? '' : 'disabled'}>
                ${
                  this.voices.length
                    ? this.voices
                        .map(
                          voice => `
                            <option
                              value="${escapeHtml(voice.ShortName)}"
                              ${voice.ShortName === selectedVoice?.ShortName ? 'selected' : ''}
                            >
                              ${escapeHtml(this.getVoiceLabel(voice))}
                            </option>
                          `,
                        )
                        .join('')
                    : `<option>${this.voiceLoadFailed ? 'Could not load Talkers Two voices' : 'Loading Talkers Two voices'}</option>`
                }
              </select>
              <p class="counter">Reader: ${escapeHtml(selectedVoiceLabel)}</p>
            </div>

            <div class="action-row">
              <button id="read-all" type="button" ${!readableWordCount || !this.voices.length ? 'disabled' : ''}>Read All</button>
            </div>
            ${
              this.lastReadText
                ? `<p class="picked-word">Reading: ${escapeHtml(this.lastReadText)}</p>`
                : ''
            }
          </article>

          <aside class="panel">
            <h2>Add a Word</h2>
            <form id="word-form">
              <label>
                Word
                <input id="word-input" name="word" autocomplete="off" placeholder="Type a word" required>
              </label>
              <label>
                Level
                <input id="level-input" name="level" type="number" min="1" max="7" placeholder="1-7" required>
              </label>
              <button type="submit">Add</button>
            </form>

            <p class="status ${this.statusTone}" aria-live="polite">${escapeHtml(this.statusMessage)}</p>

            <div class="section-head" style="margin-top: 1.1rem;">
              <h2>Saved Words</h2>
              <button class="warning tiny-button" id="reset-game" type="button" ${this.words.length ? '' : 'disabled'}>Reset</button>
            </div>

            <div class="word-bank" aria-live="polite">
              ${
                normalWords.length
                  ? normalWords.map(word => this.renderSavedWord(word)).join('')
                  : '<p class="empty-word">No saved words yet.</p>'
              }
            </div>
          </aside>
        </section>

        <section class="panel missing-panel" id="missing-panel" ${this.missingWordsUnlocked ? '' : 'hidden'}>
          <div class="section-head">
            <div>
              <h2>Missing Words</h2>
              <p class="subtitle">These level 7 words never show up in the normal game.</p>
            </div>
            <button class="secondary" id="hide-missing-words" type="button">Hide</button>
          </div>
          <div class="missing-list">
            ${
              missingWords.length
                ? missingWords
                    .map(
                      word => `
                        <div class="word-item">
                          <strong>${escapeHtml(word.text)}</strong>
                          <span class="pill">Level 7</span>
                          <button class="warning tiny-button" type="button" data-delete-word="${word.id}">Delete</button>
                        </div>
                      `,
                    )
                    .join('')
                : '<p class="empty-word">No missing words are saved.</p>'
            }
          </div>
        </section>
      </main>
    `

    this.attachEventListeners()
  }

  private attachEventListeners() {
    const root = this.shadowRoot
    if (!root) return

    root.querySelector('#word-form')?.addEventListener('submit', event => {
      event.preventDefault()
      this.addWord()
    })

    root.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(button => {
      button.addEventListener('click', () => {
        this.selectedLevel = Number(button.dataset.level) as 1 | 2 | 3 | 4 | 5 | 6
        this.activeWordIndex = 0
        this.statusMessage = `Now reading ${this.selectedLevel === 6 ? 'bonus level 6' : `level ${this.selectedLevel}`}.`
        this.statusTone = 'neutral'
        this.render()
      })
    })

    root.querySelector('#previous-word')?.addEventListener('click', () => this.moveWord(-1))
    root.querySelector('#next-word')?.addEventListener('click', () => this.moveWord(1))
    root.querySelector('#shuffle-word')?.addEventListener('click', () => this.shuffleWord())
    root.querySelector('#speak-word')?.addEventListener('click', () => this.speakAllVisibleWords())
    root.querySelector('#read-all')?.addEventListener('click', () => this.speakAllVisibleWords())
    root.querySelector('#missing-words-button')?.addEventListener('click', () => this.unlockMissingWords())
    root.querySelector('#voice-select')?.addEventListener('input', event => {
      const select = event.currentTarget as HTMLSelectElement
      this.selectedVoiceShortName = select.value
      this.saveSelectedVoice()
      this.statusMessage = `${this.getSelectedVoiceLabel()} will read the words.`
      this.statusTone = 'good'
      this.render()
    })

    root.querySelectorAll<HTMLButtonElement>('[data-show-word]').forEach(button => {
      button.addEventListener('click', () => {
        this.activeWordIndex = Number(button.dataset.showWord) || 0
        this.render()
      })
    })

    root.querySelector('#hide-missing-words')?.addEventListener('click', () => {
      this.missingWordsUnlocked = false
      this.statusMessage = 'Missing Words is locked again.'
      this.statusTone = 'neutral'
      this.render()
    })
    root.querySelector('#reset-game')?.addEventListener('click', () => this.resetGame('The game is reset. Start adding words again.'))

    root.querySelectorAll<HTMLButtonElement>('[data-delete-word]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteWord
        if (!id) return
        this.words = this.words.filter(word => word.id !== id)
        this.activeWordIndex = 0
        this.saveWords()
        this.statusMessage = 'That word was deleted.'
        this.statusTone = 'neutral'
        this.render()
      })
    })
  }

  private renderSavedWord(word: ReadingWord) {
    const isBonusLocked = word.level === 6 && this.selectedLevel !== 6
    const wordText = isBonusLocked ? 'Bonus word locked' : word.text

    return `
      <div class="word-item">
        <strong class="${isBonusLocked ? 'locked' : ''}">${escapeHtml(wordText)}</strong>
        <span class="pill">${word.level === 6 ? 'Bonus 6' : `Level ${word.level}`}</span>
        <button class="warning tiny-button" type="button" data-delete-word="${word.id}">Delete</button>
      </div>
    `
  }

  private addWord() {
    const root = this.shadowRoot
    if (!root) return

    const wordInput = root.querySelector<HTMLInputElement>('#word-input')
    const levelInput = root.querySelector<HTMLInputElement>('#level-input')
    const text = wordInput?.value.trim() ?? ''
    const levelRaw = levelInput?.value.trim() ?? ''
    const level = Number(levelRaw) as WordLevel

    if (!text) {
      this.statusMessage = 'Type a word before adding it.'
      this.statusTone = 'bad'
      this.render()
      return
    }

    if (!levelRaw || !Number.isInteger(level) || level < 1 || level > 7) {
      this.statusMessage = 'The level must be 1, 2, 3, 4, 5, 6, or 7.'
      this.statusTone = 'bad'
      this.render()
      return
    }

    const word: ReadingWord = {
      id: this.createId(),
      text,
      level,
      createdAt: Date.now(),
    }

    this.words = [word, ...this.words]
    this.selectedLevel = level === 7 ? this.selectedLevel : Math.min(level, 6) as 1 | 2 | 3 | 4 | 5 | 6
    this.activeWordIndex = 0
    this.saveWords()

    if (level === 7) {
      this.statusMessage = `${text} went to Missing Words. Use the secret to see it.`
    } else if (level === 6) {
      this.statusMessage = `${text} was added to bonus level 6.`
    } else {
      this.statusMessage = `${text} starts showing at level ${level}.`
    }
    this.statusTone = 'good'
    this.render()
  }

  private getVisibleWords() {
    return this.getVisibleWordsForLevel(this.selectedLevel)
  }

  private getVisibleWordsForLevel(level: 1 | 2 | 3 | 4 | 5 | 6) {
    return this.words.filter(word => {
      if (word.level === 7) return false
      if (level === 6) return word.level <= 6
      return word.level <= level
    })
  }

  private getReadAllWords() {
    return this.words.filter(word => word.level !== 7)
  }

  private getLevelRuleText() {
    if (this.selectedLevel === 6) {
      return 'Bonus level 6 can show the hidden bonus words.'
    }

    return `This level shows words from levels 1 through ${this.selectedLevel}.`
  }

  private moveWord(direction: -1 | 1) {
    const words = this.getVisibleWords()
    if (words.length <= 1) return

    this.activeWordIndex = (this.activeWordIndex + direction + words.length) % words.length
    this.render()
  }

  private shuffleWord() {
    const words = this.getVisibleWords()
    if (words.length <= 1) return

    let nextIndex = this.activeWordIndex
    while (nextIndex === this.activeWordIndex) {
      nextIndex = Math.floor(Math.random() * words.length)
    }
    this.activeWordIndex = nextIndex
    this.render()
  }

  private async speakActiveWord() {
    await this.speakAllVisibleWords()
  }

  private async speakAllVisibleWords() {
    const words = this.getReadAllWords().map(word => word.text)
    const spokenWordList = this.formatWordList(words)
    if (!spokenWordList) return

    this.lastReadText = spokenWordList
    this.statusMessage = `Reading all ${words.length} words together.`
    this.statusTone = 'good'
    this.render()

    await this.speakText(spokenWordList, 'all words')
  }

  private async speakText(text: string, statusText: string) {
    try {
      this.currentAudio?.pause()
      const voice = await this.getReaderVoice()
      const audio = await playTextAzure(
        {
          values: {
            ...voice,
            text,
          },
        },
        false,
      )

      this.currentAudio = audio
      await audio.play()
      this.statusMessage = `${this.getVoiceLabel(voice)} is reading ${statusText}.`
      this.statusTone = 'good'
      this.render()
    } catch {
      this.statusMessage = `I could not start ${this.getSelectedVoiceLabel()}. Check Talkers Two voice access.`
      this.statusTone = 'bad'
      this.render()
    }
  }

  private formatWordList(words: string[]) {
    if (words.length === 0) return ''
    if (words.length === 1) return words[0]
    if (words.length === 2) return `${words[0]} and ${words[1]}`

    const firstWords = words.slice(0, -1).join(', ')
    return `${firstWords}, and ${words[words.length - 1]}`
  }

  private async getReaderVoice() {
    if (!this.voices.length) {
      await this.loadTalkersTwoVoices()
    }

    const voice = this.getSelectedVoice()

    if (!voice) {
      throw new Error(`${this.getSelectedVoiceLabel()} was not found`)
    }

    return voice
  }

  private async loadTalkersTwoVoices() {
    if (this.voicesAreLoading || this.voices.length) return

    this.voicesAreLoading = true
    this.voiceLoadFailed = false
    this.render()

    try {
      this.voices = (await getMicrosoftVoices()).sort((left, right) =>
        this.getVoiceLabel(left).localeCompare(this.getVoiceLabel(right)),
      )
      const savedVoice = this.voices.find(voice => voice.ShortName === this.selectedVoiceShortName)
      const defaultVoice = this.findDefaultVoice()
      const selectedVoice = savedVoice ?? defaultVoice ?? this.voices[0] ?? null

      if (selectedVoice) {
        this.selectedVoiceShortName = selectedVoice.ShortName
        this.saveSelectedVoice()
      }
    } catch {
      this.voiceLoadFailed = true
    } finally {
      this.voicesAreLoading = false
      this.render()
    }
  }

  private findDefaultVoice() {
    const targetName = this.normalizeVoiceName(this.defaultReaderVoiceName)
    return (
      this.voices.find(item => {
        return [item.LocalName, item.DisplayName, item.ShortName, item.Name].some(value =>
          this.normalizeVoiceName(value).includes(targetName),
        )
      }) ?? this.voices.find(item => this.normalizeVoiceName(this.getVoiceLabel(item)).includes('goldenspark'))
    )
  }

  private getSelectedVoice() {
    return this.voices.find(voice => voice.ShortName === this.selectedVoiceShortName) ?? null
  }

  private getSelectedVoiceLabel() {
    return this.getSelectedVoice()
      ? this.getVoiceLabel(this.getSelectedVoice() as AzureVoiceInfo)
      : this.selectedVoiceShortName || this.defaultReaderVoiceName
  }

  private getVoiceLabel(voice: AzureVoiceInfo) {
    return voice.LocalName || voice.DisplayName || voice.ShortName
  }

  private normalizeVoiceName(value = '') {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  }

  private unlockMissingWords() {
    const answer = window.prompt('Enter the main secret of all time.')

    if (answer?.trim().toLowerCase() === this.missingWordsSecret) {
      this.missingWordsUnlocked = true
      this.statusMessage = 'Missing Words is unlocked.'
      this.statusTone = 'good'
      this.render()
      return
    }

    this.resetGame('Wrong secret. The whole game reset in sro3.')
    window.history.replaceState(null, '', '/sro3')
  }

  private resetGame(message: string) {
    this.words = []
    this.selectedLevel = 1
    this.activeWordIndex = 0
    this.missingWordsUnlocked = false
    this.statusMessage = message
    this.statusTone = 'bad'
    window.localStorage.removeItem(this.storageKey)
    this.render()
  }

  private loadWords() {
    try {
      const saved = window.localStorage.getItem(this.storageKey)
      if (!saved) return

      const parsed = JSON.parse(saved) as ReadingWord[]
      this.words = parsed.filter(word => {
        return (
          typeof word.id === 'string' &&
          typeof word.text === 'string' &&
          Number.isInteger(word.level) &&
          word.level >= 1 &&
          word.level <= 7
        )
      })
    } catch {
      this.words = []
    }
  }

  private saveWords() {
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.words))
  }

  private loadSelectedVoice() {
    this.selectedVoiceShortName = window.localStorage.getItem(this.voiceStorageKey) || ''
  }

  private saveSelectedVoice() {
    window.localStorage.setItem(this.voiceStorageKey, this.selectedVoiceShortName)
  }

  private createId() {
    if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

if (typeof window !== 'undefined' && !customElements.get('sro3-app')) {
  customElements.define('sro3-app', Sro3WordLevelGame)
}
