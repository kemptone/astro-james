const MAX_LEVEL = 5
const VOWELS = ['A', 'E', 'I', 'O', 'U'] as const

function normalizeLevels(value: string) {
  const uniqueLevels = Array.from(
    new Set((value || '').replace(/\s+/g, '').split('').filter(level => /[1-5]/.test(level)))
  )

  return uniqueLevels.sort().join('')
}

class WCDictionarySearch extends HTMLElement {
  connectedCallback() {
    const e_currentLevel = this.querySelector<HTMLElement>('[data-current-level]')
    const e_levelNote = this.querySelector<HTMLElement>('[data-level-note]')
    const e_pressedStatus = this.querySelector<HTMLElement>('[data-pressed-status]')
    const e_submitGame = this.querySelector<HTMLButtonElement>('[data-submit-game]')
    const e_nextLevel = this.querySelector<HTMLButtonElement>('[data-next-level]')
    const e_resetGame = this.querySelector<HTMLButtonElement>('[data-reset-game]')

    const e_inputs = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLInputElement>(`[data-vowel-input="${vowel}"]`),
      ])
    )

    const e_codes = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLElement>(`[data-vowel-code="${vowel}"]`),
      ])
    )

    const e_marks = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLElement>(`[data-vowel-mark="${vowel}"]`),
      ])
    )

    const e_states = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLElement>(`[data-vowel-state="${vowel}"]`),
      ])
    )

    const e_cards = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLButtonElement>(`[data-vowel-card="${vowel}"]`),
      ])
    )

    const e_previews = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLElement>(`[data-preview-vowel="${vowel}"]`),
      ])
    )

    const e_previewMarks = new Map(
      VOWELS.map(vowel => [
        vowel,
        this.querySelector<HTMLElement>(`[data-preview-mark="${vowel}"]`),
      ])
    )

    let activeLevel = 1
    let isSubmitted = false
    let pressedOnLevel = new Set<string>()

    const markPressed = (vowel: string) => {
      if (!isSubmitted) return
      pressedOnLevel.add(vowel)
      updateView()
    }

    const pressCard = (vowel: string) => {
      if (!isSubmitted) {
        e_inputs.get(vowel)?.focus()
        return
      }
      markPressed(vowel)
    }

    const submitGame = () => {
      if (isSubmitted) return
      isSubmitted = true
      pressedOnLevel = new Set<string>()
      updateView()
    }

    const goToNextLevel = () => {
      if (!isSubmitted) return
      if (pressedOnLevel.size < VOWELS.length) return
      if (activeLevel >= MAX_LEVEL) return

      activeLevel += 1
      pressedOnLevel = new Set<string>()
      updateView()
    }

    const resetGame = () => {
      activeLevel = 1
      isSubmitted = false
      pressedOnLevel = new Set<string>()

      VOWELS.forEach(vowel => {
        const e_input = e_inputs.get(vowel)
        if (e_input) {
          e_input.value = ''
        }
      })

      updateView()
    }

    const updateView = () => {
      if (e_currentLevel) {
        e_currentLevel.textContent = `Level ${activeLevel} of ${MAX_LEVEL}`
      }

      if (e_levelNote) {
        if (!isSubmitted) {
          e_levelNote.textContent = 'Type the vowel rules, then press Submit to start the game.'
        } else {
          e_levelNote.textContent =
            activeLevel === MAX_LEVEL
              ? 'This is the last level. Press all 5 vowels to finish.'
              : 'Press all 5 vowels before going to the next level.'
        }
      }

      VOWELS.forEach(vowel => {
        const e_input = e_inputs.get(vowel)
        const cleaned = normalizeLevels(e_input?.value || '')
        const isCrossed = cleaned.includes(String(activeLevel))
        const isPressed = isSubmitted && pressedOnLevel.has(vowel)

        if (e_input && e_input.value !== cleaned) {
          e_input.value = cleaned
        }
        if (e_input) {
          e_input.disabled = isSubmitted
          e_input.hidden = isSubmitted
        }

        const e_code = e_codes.get(vowel)
        if (e_code) {
          e_code.textContent = cleaned || 'none'
        }

        const e_state = e_states.get(vowel)
        if (e_state) {
          if (!isSubmitted) {
            e_state.textContent = 'type the crossed-out levels, then submit'
          } else {
            e_state.textContent = isPressed
              ? `${isCrossed ? 'X' : 'O'} on level ${activeLevel}`
              : `press to reveal level ${activeLevel}`
          }
        }

        const e_card = e_cards.get(vowel)
        e_card?.closest('.vowel-input-card')?.classList.toggle('is-pressed', isPressed)
        if (e_card) {
          e_card.dataset.ready = isSubmitted ? 'true' : 'false'
        }

        const e_mark = e_marks.get(vowel)
        if (e_mark) {
          e_mark.textContent = isPressed ? (isCrossed ? 'X' : 'O') : ''
          e_mark.dataset.state = isPressed
            ? isCrossed
              ? 'crossed'
              : 'circled'
            : 'hidden'
        }

        const e_preview = e_previews.get(vowel)
        const e_previewMark = e_previewMarks.get(vowel)
        if (e_preview) {
          e_preview.dataset.state = isPressed
            ? isCrossed
              ? 'crossed'
              : 'circled'
            : 'hidden'
        }
        if (e_previewMark) {
          e_previewMark.textContent = isPressed ? (isCrossed ? 'X' : 'O') : ''
        }
      })

      if (e_pressedStatus) {
        if (!isSubmitted) {
          e_pressedStatus.textContent = 'Type your vowel rules, then press Submit.'
        } else {
          e_pressedStatus.textContent =
            pressedOnLevel.size === VOWELS.length
              ? `All 5 vowels were pressed on level ${activeLevel}.`
              : `Pressed ${pressedOnLevel.size} of 5 vowels on this level.`
        }
      }

      if (e_submitGame) {
        e_submitGame.disabled = isSubmitted
        e_submitGame.textContent = isSubmitted ? 'Submitted' : 'Submit'
      }

      if (e_nextLevel) {
        const isLastLevel = activeLevel >= MAX_LEVEL
        const allPressed = pressedOnLevel.size === VOWELS.length

        e_nextLevel.disabled = !isSubmitted || !allPressed || isLastLevel
        e_nextLevel.textContent = isLastLevel ? 'All 5 levels done' : 'Next level'
      }
    }

    VOWELS.forEach(vowel => {
      const e_input = e_inputs.get(vowel)
      const e_card = e_cards.get(vowel)
      if (!e_input || !e_card) return

      e_card.addEventListener('click', () => {
        pressCard(vowel)
      })

      e_input.addEventListener('input', () => {
        updateView()
      })
    })

    e_submitGame?.addEventListener('click', submitGame)
    e_nextLevel?.addEventListener('click', goToNextLevel)
    e_resetGame?.addEventListener('click', resetGame)

    updateView()
  }
}

if (typeof window !== 'undefined')
  customElements.define('wc-dictionary-search', WCDictionarySearch)
